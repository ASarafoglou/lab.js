import { fromPairs, mapValues, template } from 'lodash'

import loadPlugin from './load'

// File management
// Plugin files are placed in `lib/plugins/${ pluginName }`.
// This code moves plugin files and updates the paths accordingly.
const pluginDir = 'lib/plugins'

// Prepend plugin path to filenames
const prependPath = (files={}, pluginName) =>
  fromPairs(
    Object.entries(files).map(([path, data]) => [
      `${ pluginDir }/${ pluginName }/${ path }`,
      data,
    ])
  )

// Add plugin path to header attributes
const parseHeaders = (headers=[], pluginName) =>
  headers.map(([tag, attributes]) => [
    tag,
    mapValues(attributes, a =>
      typeof a === 'string'
        ? template(a)({ pluginPath: `${ pluginDir }/${ pluginName }` })
        : a
    ),
  ])

export const embedPlugins = state => {
  // Collect plugins used in components
  const plugins = Object.entries(state.components)
    .map(([_, c]) => c.plugins || [])
    .reduce((prev, a) => prev.concat(a), [])

  // Load plugins, ignoring unknown ones
  const loadedPlugins = plugins
    .map(p => loadPlugin(p.type))
    .filter(p => p !== undefined)

  // Move files and update page headers
  const pluginFiles = loadedPlugins
    .map(p => prependPath(p.files, p.name))
    .reduce((prev, o) => Object.assign(prev, o), {})

  const pluginHeaders = loadedPlugins
    .map(p => parseHeaders(p.headers, p.name))
    .reduce((prev, a) => prev.concat(a), [])

  return {
    pluginFiles,
    pluginHeaders,
  }
}
