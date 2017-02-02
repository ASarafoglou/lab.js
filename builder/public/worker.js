importScripts('vendor/sw-toolbox.js')
importScripts('vendor/localforage.min.js')
importScripts('vendor/lodash.min.js')
importScripts('vendor/serialize-javascript.js')

// Utilities -------------------------------------------------------------------

const root = (() => {
  var tokens = (self.location + '').split('/');
  tokens[tokens.length - 1] = '';
  return tokens.join('/');
})()

const processGrid = (grid, colnames=null, types=undefined) =>
  grid.rows
    // Filter rows without data
    .filter( r => !r.every( c => c.trim() === '' ))
    // Convert types if requested
    .map( r => r.map( (c, i) => {
      if (types === undefined) {
        // Return value unchanged
        return c
      } else {
        // Convert types
        switch(types[i]) {
          case 'string':
            return _.toString(c)
          case 'number':
            return c.trim() === '' ? null : _.toNumber(c)
          default:
            return undefined
        }
      }
    }) )
    // Use column names to create array of row objects.
    // If column names are passed as a parameter,
    // use those, otherwise rely on the grid object
    .map( r => _.fromPairs(_.zip(colnames || grid.columns, r)) )

const processMessageHandlers = (messageHandlers) => {
  const handlers = _.fromPairs(
    messageHandlers.rows
      .map(r => r[0])
      .filter(h => h.message.trim() !== '' && h.code.trim() !== '')
      .map(h => [h.message, new Function(h.code)])
  )

  return handlers
}

const createResponsePair = r =>
  // Process an object with the structure
  // { label: 'label', event: 'keypress', ...}
  // into an array with two parts: a label,
  // and an event definition, such as
  // ['keypress(r)', 'red']
  [
    `${ r.event }` +
      `${ r.filter ? `(${ r.filter.trim() })` : ''}` +
      `${ r.target ? ` ${ r.target.trim() }`  : ''}`,
    r.label.trim()
  ]

// Process individual fields
const processResponses = (responses) => {
  // Process responses as a grid, resulting in an array
  // of objects that contain the individual parts
  const grid = processGrid(responses, ['label', 'event', 'target', 'filter'])
  // Process each of these objects into an array
  // of [responseParams, label] pairs
  const pairs = grid.map(createResponsePair)
  // Finally, create an object of
  // { responseParams: label } mappings
  return _.fromPairs(pairs)
}

// Template parameters are also a grid,
// but column names and data types are defined
// as properties of an object.
const processTemplateParameters = grid =>
  processGrid(
    grid,
    grid.columns.map(c => c.name),
    grid.columns.map(c => c.type)
  )

// Process any single node in isolation
const processNode = node => {
  // TODO: This filters empty string values, which are
  // created by empty form fields in the builder. This is
  // hackish, and may not work indefinately -- it might
  // have to be solved on the input side, or by making
  // the library more resilient to malformed input.
  // Either way, this is probably not the final solution.
  return Object.assign({}, _.pickBy(node, value => value !== ''), {
    messageHandlers: node.messageHandlers
      ? processMessageHandlers(node.messageHandlers)
      : node.messageHandlers,
    responses: node.responses
      ? processResponses(node.responses)
      : {},
    templateParameters: node.templateParameters
      ? processTemplateParameters(node.templateParameters)
      : node.templateParameters,
  })
}

// Process a node and its children
const makeComponentTree = (data, root) => {
	const currentNode = processNode(data[root])

  if (currentNode) {
    const output = Object.assign({}, currentNode)

    // Convert children, if available
    if (currentNode.children) {
      switch (currentNode.type) {
        case 'lab.flow.Sequence':
          // A sequence can have several components as content
          output.content = currentNode.children
            .map(c => makeComponentTree(data, c))
          break;
        case 'lab.flow.Loop':
          // A loop has a single template
          output.template = makeComponentTree(data, currentNode.children[0])
          break;
      }

      // After parsing, children components are no longer needed
      delete output.children
    }

    // Delete unused fields
    delete output.id

    return output
  } else {
    return {}
  }
}

const makeStudyScript = studyTreeJSON =>
`// Define study
const study = lab.util.fromObject(${ studyTreeJSON })

// Add data storage support
study.options.datastore = new lab.data.Store()

// Let's go!
study.run()`

const processStudy = studyObject => {
  // Add debug plugin to root component
  // (this might be made optional at some point)
  studyObject.components.root.plugins = [
    { type: 'lab.plugins.Debug' }
  ]

  // Process study tree
  const componentTree = makeComponentTree(studyObject.components, 'root')
  const studyTreeJSON = serialize(componentTree, { space: 2 })
  return makeStudyScript(studyTreeJSON)
}

// Worker initialisation -------------------------------------------------------

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.resolve()
      .then(() => {
        console.log('Service worker installed at', root)
      })
      .then(() => {
        // Make the worker the active service worker,
        // also triggering the activate event
        return self.skipWaiting()
      })
      .catch(error => {
        console.log('Error during installation', error)
      })
  )
})

// Claim this worker as the active worker for all clients,
// as per https://serviceworke.rs/immediate-claim.html
self.addEventListener('activate', event => {
  console.log('Activating service worker')
  return self.clients.claim()
})

// Path configuration ----------------------------------------------------------

toolbox.router.post('api/:instance/update', (request, values) => {
  console.log('Updating internal data')
  return request.json()
    .then(c => localforage.setItem(values.instance, c))
    .then(c => new Response('Internal data updated', { status: 200 }))
    .catch(e => new Response(`An error occured while updating internal data: ${e}`, { status: 500 }))
})

toolbox.router.get('api/:instance/download', (request, values) => {
  console.log(`Preparing study ${ values.instance } for download`)
  const headers = new Headers()
  headers.append("Content-disposition", "attachment; filename=labjs.webexp")
  return localforage.getItem(values.instance)
    .then(r => JSON.stringify(r, null, 2))
    .then(r => new Response(r, { status: 200, headers: headers }))
    .catch(e => new Response('Error ' + e, { status: 500 }))
})

// TODO: For undefined instances, this should return 404,
// and possibly also the redirects for static files below
toolbox.router.get('api/:instance/preview/script.js', (request, values) => {
  console.log(`Serving script for study ${ values.instance }`)
  return localforage.getItem(values.instance)
    .then(r => processStudy(r))
    .then(r => new Response(r, { status: 200 }))
    .catch(e => new Response('Error ' + e, { status: 500 }))
})

toolbox.router.get('api/:instance([a-zA-Z\d_]+)/preview/:path(.+)', (request, values) => {
  console.log(`Accessing (presumably static) file ${ values.path }`)
  if (values.instance.startsWith('_')) {
    return
  } else {
    return localforage.getItem(values.instance)
      .then(r => r.files)
      .then(files => {
        if (Object.keys(files.files).includes(values.path)) {
          const headers = new Headers()
          headers.append("Content-type", files.files[values.path].type)
          return new Response(
            files.files[values.path].content, { status: 200, headers }
          )
        } else if (Object.keys(files.bundledFiles).includes(values.path)) {
          const newPath = `${ root }api/_defaultStatic/${ values.path }`
          console.log(`Redirecting request from ${ request.url } to ${ newPath }`)
          return Response.redirect(newPath)
        } else {
          return new Response('Couldn\'t find requested file', { status: 404 })
        }
      })
  }
})
