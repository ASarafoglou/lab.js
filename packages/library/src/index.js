// Components
import { Component, Dummy } from './core'
import { Screen as CanvasScreen, Sequence as CanvasSequence,
  Frame as CanvasFrame } from './canvas'
import { Screen, Form, Frame } from './html'
import { Sequence, Parallel, Loop } from './flow'

// Data storage
import { Store } from './data'

// Utilities
import { Random } from './util/random'
import fromObject from './util/fromObject'
import { toRadians, transform, makeRenderFunction } from './util/canvas'
import { launch, exit } from './util/fullscreen'
import { sum, mean, variance, std } from './util/stats'
import { traverse, reduce } from './util/tree'

// Plugins
import Debug from './plugins/debug'
import Download from './plugins/download'
import Logger from './plugins/log'
import Metadata from './plugins/metadata'
import PostMessage from './plugins/postmessage'
import Transmit from './plugins/transmit'

export const version = '2017.1.0'

export const core = {
  Component,
  Dummy,
}

export const canvas = {
  Frame: CanvasFrame,
  Screen: CanvasScreen,
  Sequence: CanvasSequence,
}

export const html = {
  Screen,
  Form,
  Frame,
}

export const flow = {
  Sequence,
  Parallel,
  Loop,
}

export const plugins = {
  Debug,
  Download,
  Logger,
  Metadata,
  PostMessage,
  Transmit,
}

export const data = {
  Store,
}

export const util = {
  Random,
  fromObject,
  canvas: {
    makeRenderFunction,
    toRadians,
    transform,
  },
  fullscreen: {
    launch, exit,
  },
  stats: {
    sum, mean, variance, std
  },
  tree: {
    traverse, reduce,
  },
}
