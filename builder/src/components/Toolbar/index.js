import React from 'react'
import { ButtonGroup, Button } from 'reactstrap'

import './styles.css'

const Toolbar = (props, context) =>
  <div className="toolbar">
    <ButtonGroup>
      <Button color="primary">
        <i className="fa fa-play" aria-hidden="true"></i>
      </Button>
    </ButtonGroup>{' '}
    <ButtonGroup>
      <Button
        onClick={() => {
          if (window.confirm('Do you really want to reset the study?')) {
            context.store.dispatch({ type: 'RESET_STATE' })
            context.store.dispatch({ type: 'SHOW_COMPONENT_DETAIL', id: null })
          }
        }}
      >
        <i className="fa fa-file-o" aria-hidden="true"></i>
      </Button>
      <Button>
        <i className="fa fa-folder-open-o" aria-hidden="true"></i>
      </Button>
      <Button>
        <i className="fa fa-save" aria-hidden="true"></i>
      </Button>
    </ButtonGroup>{' '}
    <ButtonGroup>
      <Button>
        <i className="fa fa-file-archive-o" aria-hidden="true"></i>
      </Button>
      <Button>
        <i className="fa fa-sliders" aria-hidden="true"></i>
      </Button>
    </ButtonGroup>
  </div>

Toolbar.contextTypes = {
  store: React.PropTypes.object
}

export default Toolbar
