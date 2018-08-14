import React from 'react'
import PropTypes from 'prop-types'
import Uploader from '../../../../../Uploader'
import { fromJSON } from '../../../../../../logic/io/load'

const ImportTab = ({ parent, index }, context) =>
  <Uploader
    accept="application/json"
    maxSize={ 1 * 10**6 } // 1 MB
    onUpload={
      fileContents => {
        try {
          // Parse file from JSON
          const state = fromJSON(fileContents)
          // Hydrate store from resulting object
          context.store.dispatch({
            type: 'IMPORT_COMPONENT',
            parent, index,
            id: state.components.root.children[0],
            source: state.components,
          })
          context.store.dispatch({
            type: 'HIDE_MODAL',
          })
        } catch(e) {
          // If things don't work out, let the user know
          alert('Couldn\'t load file, found error', e)
        }
      }
    }
  >
    <button className="btn btn-outline-secondary btn-lg btn-block">
      <strong>Import component</strong> from file
    </button>
  </Uploader>


ImportTab.contextTypes = {
  store: PropTypes.object,
}

export default ImportTab
