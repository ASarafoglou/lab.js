import { EventHandler } from './base'
import { preload_image, preload_audio } from './util/preload'
import _ from 'lodash'

// Define status codes
export const status = Object.freeze({
  initialized:  0,
  prepared:     1,
  running:      2,
  done:         3
})

// Generic building block for experiment
export class BaseElement extends EventHandler {
  constructor(options={}) {
    // Construct the EventHandler first
    super(options)

    // Setup a storage for internal properties
    // (these are not supposed to be directly
    // available to users, and will not be documented)
    this.internals = {}

    // Setup a document node within which
    // the element operates
    this.el = options.el || null

    // Save the type of element as well as
    // its position in the hierarchy
    this.title = options.title || null
    this.element_type = this.constructor.name
    this.id = options.id || null

    // Setup 'tardyness'
    // If this option is set, the element will not
    // respond to automated calls to its prepare
    // method by superordinate elements (e.g. a
    // sequence in which it is nested). Instead,
    // it will prepare when run or after a manual
    // .prepare() call.
    this.tardy = options.tardy || false

    // Save element status
    this.status = status.initialized

    // Set parent, if defined
    this.parent = options.parent || null

    // Setup responses
    this.responses = options.responses || {}
    this.response_correct = options.response_correct || null

    // Setup data handling
    this.data = options.data || {}
    this.datastore = options.datastore || null
    this.datacommit = options.datacommit || null

    // Setup parameters
    this.parameters = options.parameters || {}

    // Setup media handling
    this.media = options.media || {}
    this.media.images = this.media.images || []
    this.media.audio = this.media.audio || []

    // Set a timeout, if a useful value is provided
    // (this somewhat convoluted query is necessary
    // because a zero value evaluates to false in JS)
    this.timeout = options.timeout || options.timeout === 0 ?
      options.timeout : null

    // Setup console output grouping
    // when the element is run
    if (this.debug) {
      this.on('before:run', () => console.group(this.element_type))
      this.on('after:end', () => console.groupEnd())
    }
  }

  // Actions ----------------------------------------------
  prepare(direct_call=true) {
    // Prepare an element prior to its display,
    // for example by pre-loading or pre-rendering
    // content

    // Skip the remainder of the function if the
    // prepare call was automated and the element
    // is labeled as tardy
    if (this.tardy && !direct_call) {
      if (this.debug) {
        console.log('Skipping automated preparation')
      }
      return;
    }

    // Direct output to the HTML element with the id
    // 'labjs-content', unless a different element
    // has been provided explicitly
    if (this.debug && this.el == null) {
      console.log('No output element specified, using #labjs-content')
    }
    this.el = this.el || document.getElementById('labjs-content')

    // Setup automatic event handling for responses
    Object.keys(this.responses).forEach(
      eventString => {
        this.events[eventString] = function(e) {
          // Trigger internal response handling
          this.respond(this.responses[eventString])
        }
      }
    )

    // Prepare timeout
    if (this.timeout !== null) {
      // Add a timeout to end the element
      // automatically after the specified
      // duration.
      this.on('run', () => {
        this.timeoutTimer = window.setTimeout(
          () => {
            this.end('timeout')
          },
          this.timeout
        )
      })
    }

    // Setup data storage
    // (unless it has been explicitly disabled)
    if (this.datastore && this.datacommit !== false) {
      this.datacommit = true
      this.on('after:end', this.commit)
    }

    // Preload media
    // FIXME: This is asynchronous at present,
    // meaning that the experiment will not wait until
    // all media are fully loaded.
    Promise.all( this.media.images.map(preload_image) )
    Promise.all( this.media.audio.map(preload_audio) )

    // Trigger related methods
    this.triggerMethod('prepare', direct_call)

    // Update status
    this.status = status.prepared
  }

  run() {
    // Prepare element if this has not been done
    if (this.status < status.prepared) {
      if (this.debug) {
        console.log('Preparing at the last minute')
      }
      this.prepare()
    }

    // Trigger pre-run hooks
    this.triggerMethod('before:run')

    // Update status
    this.status = status.running

    // Note the time
    this.data.time_run = performance.now()

    // Run an element by showing it
    this.triggerMethod('run')

    // Return a promise that is resolved after
    // the element has been run
    return new Promise((resolve, reject) => {
      this.on('end', resolve)
    })
  }

  respond(response=null) {
    // Save response
    this.data.response = response

    // Save ideal response and response veracity
    if (this.response_correct !== null) {
      this.data.response_correct = this.response_correct
      this.data.correct =
        this.data.response === this.response_correct
    }

    // End screen
    this.end('response')
  }

  end(reason=null) {
    // Note the time of and reason for ending
    this.data.time_end = performance.now()
    this.data.ended_on = reason

    // Update status
    this.status = status.done

    // Cancel the timeout timer
    if (this.timeout !== null) {
      window.clearTimeout(this.timeoutTimer)
    }

    // Complete an element's run and cleanup
    this.triggerMethod('end')

    // A final goodbye once everything is done
    // TODO: This won't work when an element
    // in a sequence is cancelled.
    this.triggerMethod('after:end')
  }

  // Data collection --------------------------------------
  // (the commit method is called automatically if the
  // datacommit option is true, which it is by default)
  commit() {
    // If a data store is defined
    if (this.datastore) {
      // Commit the data collected by this element
      this.datastore.commit(
        // ... plus some additional metadata
        _.extend(this.data, this.parameters_aggregate, {
          duration: this.data.time_end - this.data.time_run,
          sender: this.title,
          sender_type: this.element_type,
          sender_id: this.id,
          time_commit: performance.now(),
          timestamp: new Date().toISOString()
        })
      )
    }
  }

  get timer() {
    switch (this.status) {
      case status.running:
        return performance.now() - this.data.time_run
      case status.done:
        return this.data.time_end - this.data.time_run
      default:
        return undefined
    }
  }

  get parents() {
    let output = []
    let current_element = this

    // Traverse hierarchy upwards
    while (current_element.parent) {
      current_element = current_element.parent
      output = output.concat(current_element)
    }

    // Sort in a top-to-bottom order
    return output.reverse()
  }

  get parameters_aggregate() {
    return _.extend(
      {}, ...this.parents.map(o => o.parameters),
      this.parameters
    )
  }
}

// Default options ----------------------------------------
// Attributes to pass on to nested items (as names)
export let hand_me_downs = [
  'debug',
  'datastore',
  'el'
]

// Simple elements ----------------------------------------
// A DummyElement does nothing and ends
// immediately as soon as it is called
export class DummyElement extends BaseElement {
  constructor(options={}) {
    options.timeout = options.timeout || 0;
    super(options)
  }
}
