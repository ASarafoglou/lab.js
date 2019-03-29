// Utilities -------------------------------------------------------------------

// Wrap context.decodeAudioData in a callback,
// because Safari doesn't (as of now) support the promise-based variant
const decodeAudioData = (context, buffer) => {
  return new Promise((resolve, reject) => {
    context.decodeAudioData(buffer, resolve, reject)
  })
}

export const load = async (context, url, options) => {
  const response = await fetch(url, options)

  if (response.ok) {
    const buffer = await response.arrayBuffer()
    try {
      const decodedData = await decodeAudioData(context, buffer)
      if (!decodedData) {
        throw new Error(`No data available after decoding ${ url }`)
      }
      return decodedData
    } catch (e) {
      throw new Error(`Error decoding audio data from ${ url }`)
    }
  } else {
    throw new Error(`Couldn't load audio from ${ response.url }`)
  }
}

const outputTimestamps = (context, useContextTiming=false) => {
  if (useContextTiming && 'getOutputTimestamp' in context) {
    return {
      ...context.getOutputTimestamp(),
      baseLatency: context.baseLatency || 0,
    }
  } else {
    return {
      contextTime: context.currentTime,
      performanceTime: performance.now(),
      baseLatency: context.baseLatency || 0,
    }
  }
}

const toContextTime = (context, t) => {
  const { contextTime, performanceTime, baseLatency } =
    outputTimestamps(context)
  return (t - performanceTime) / 1000 + contextTime - baseLatency
}

const toPerformanceTime = (context, t) => {
  // Where available, use audio system data to calculate
  // latency compensation, as per specification.
  // See https://webaudio.github.io/web-audio-api/
  const { contextTime, performanceTime, baseLatency } =
    outputTimestamps(context)
  return (t - contextTime + baseLatency) * 1000 + performanceTime
}

const createNode = (context, type, options={}, audioParams={}) => {
  // This provides a light wrapper around the context
  // audio node creation methods, as a stopgap until
  // all browsers support node constructor functions.
  let node

  // Generate node from context
  switch(type) {
    case 'oscillator':
      node = context.createOscillator()
      break
    case 'bufferSource':
      node = context.createBufferSource()
      break
    default:
      throw new Error(`Can't create node of unknown type`)
  }

  // Apply settings
  Object.entries(options).forEach(
    ([setting, value]) => { if (value) node[setting] = value }
  )
  Object.entries(audioParams).forEach(
    ([setting, value]) => { if (value) node[setting].value = value }
  )

  return node
}

const connectNodeChain = (source, chain, destination) =>
  [source, ...chain, destination].reduce(
    (prev, next) => prev.connect(next)
  )

// Timeline items --------------------------------------------------------------

class AudioNodeItem {
  defaultPayload = {
    gain: 1,
    panningModel: 'equalpower',
  }

  constructor(timeline, options={}, payload={}) {
    this.timeline = timeline
    this.options = options
    this.payload = {
      ...this.defaultPayload,
      ...payload,
    }
    this.processingChain = []
    this.nodeOrder = {}
  }

  prepare() {
    // Add gain node
    if (
      (this.payload.gain && this.payload.gain !== 1) ||
      (this.payload.rampUp && this.payload.rampUp !== 0) ||
      (this.payload.rampDown && this.payload.rampDown !== 0)
    ) {
      const gainNode = this.timeline.controller.audioContext.createGain()
      gainNode.gain.value = this.payload.rampUp ? 0.0001 : this.payload.gain
      this.nodeOrder.gain = this.processingChain.push(gainNode) - 1
    }

    // Add panner node
    if (this.payload.pan && this.payload.pan !== 0) {
      const pannerNode = this.timeline.controller.audioContext.createPanner()
      pannerNode.panningModel = this.payload.panningModel
      pannerNode.setPosition(
        this.payload.pan, 0,
        1 - Math.abs(this.payload.pan)
      )
      this.processingChain.push(pannerNode)
    }

    connectNodeChain(
      this.source, this.processingChain,
      this.timeline.controller.audioContext.destination
    )
  }

  start(offset) {
    const { start } = this.options
    const { rampUp } = this.payload

    const startTime = Math.max(
      0,
      toContextTime(
        this.timeline.controller.audioContext,
        offset + start
      )
    )

    if (rampUp) {
      const gain = this.processingChain[this.nodeOrder.gain].gain

      // Calculate transition point
      const rampUpEnd = toContextTime(
        this.timeline.controller.audioContext,
        offset + start + parseFloat(rampUp)
      )

      // Cue transition
      gain.setValueAtTime(0.0001, startTime)
      gain.exponentialRampToValueAtTime(this.payload.gain, rampUpEnd)
    }

    this.source.start(startTime)
  }

  afterStart(offset) {
    const { stop } = this.options
    const { rampDown } = this.payload

    if (stop && rampDown) {
      const gain = this.processingChain[this.nodeOrder.gain].gain

      const rampDownStart = toContextTime(
        this.timeline.controller.audioContext,
        offset + stop - parseFloat(rampDown)
      )
      const stopTime = toContextTime(
        this.timeline.controller.audioContext,
        offset + stop
      )

      // Cue transition (we can't go all the way because of the
      // exponential transform, but the node will be stopped shortly,
      // anyway)
      gain.setValueAtTime(this.payload.gain, rampDownStart)
      gain.exponentialRampToValueAtTime(0.0001, stopTime)
    }

    if (stop) {
      const stopTime = toContextTime(
        this.timeline.controller.audioContext,
        offset + stop
      )
      this.source.stop(stopTime)
    }
  }

  teardown() {
    this.source.disconnect()
    this.source = undefined

    this.processingChain.forEach(n => n.disconnect())
    this.processingChain = []
    this.nodeOrder = {}
  }
}

export class BufferSourceItem extends AudioNodeItem {
  async prepare() {
    // Populate buffer from cache
    const cache = this.timeline.controller.cache
    let buffer
    if (cache.audio[this.payload.src]) {
      buffer = cache.audio[this.payload.src]
    } else {
      buffer = await load(
        this.timeline.controller.audioContext,
        this.payload.src,
        { mode: 'cors' }
      )
      cache.audio[this.payload.src] = cache.audio[this.payload.src] || buffer
    }
    // TODO: This seems to be the wrong place for a fallback.
    // Adjust the caching mechanism so that the preload stage knows
    // about the audio file, so that the cache is always present.

    this.source = createNode(
      this.timeline.controller.audioContext,
      'bufferSource',
      { buffer },
    )
    super.prepare()
  }
}

export class OscillatorItem extends AudioNodeItem {
  prepare() {
    const { type, frequency, detune } = this.payload

    this.source = createNode(
      this.timeline.controller.audioContext,
      'oscillator',
      { type },
      { frequency, detune },
    )

    super.prepare()
  }
}
