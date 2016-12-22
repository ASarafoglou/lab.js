import React from 'react'
import Modal from 'react-modal'

// Individual, task-specific modal content
import AddComponentModal from './components/AddComponent'

const MODAL_COMPONENTS = {
  'ADD_COMPONENT': AddComponentModal,
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
      className="modal-dialog"
      overlayClassName="modal fade in"
      contentLabel="App Modal"
      style={{
        overlay: {
          display: 'block',
          backgroundColor : 'rgba(0, 0, 0, 0.5)',
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
