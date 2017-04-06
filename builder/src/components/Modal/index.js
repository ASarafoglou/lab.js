import React from 'react'
import Modal from 'react-modal'
import classnames from 'classnames'

// Individual, task-specific modal content
import AddComponentModal from './components/AddComponent'
import OptionsModal from './components/Options'
import SystemCompatibilityModal from './components/SystemCompatibility'

const MODAL_COMPONENTS = {
  'ADD_COMPONENT': AddComponentModal,
  'OPTIONS': OptionsModal,
  'SYSTEM_COMPATIBILITY': SystemCompatibilityModal,
}

// Overall general-purpose modal container
import './index.css'

// TODO: See if the Modal component from react-modal
// can be replaced by its counterpart from reactstrap
const CustomModal = ({ modalType, modalProps }, context) => {
  const SpecificModal = MODAL_COMPONENTS[modalType] || 'div'
  return (
    <Modal
      isOpen={ modalType !== null }
      className={ classnames({
        'modal-dialog': true,
        'modal-lg': modalProps.large,
      }) }
      overlayClassName="modal fade show"
      contentLabel="App Modal"
      style={{
        overlay: {
          display: 'block',
          backgroundColor : 'rgba(0, 0, 0, 0.5)',
          opacity: '1',
          overflowX: 'hidden',
          overflowY: 'auto',
        }
      }}
    >
      <SpecificModal
        {...modalProps}
        closeHandler={() => {
          context.store.dispatch({
            type: 'HIDE_MODAL',
          })
        }}
      />
    </Modal>
  )
}

// Redux integration
import { connect } from 'react-redux'

CustomModal.contextTypes = {
  store: React.PropTypes.object
}

const ConnectedModal = connect(
  (state, ownProps) => state.modal
)(CustomModal)

export default ConnectedModal
