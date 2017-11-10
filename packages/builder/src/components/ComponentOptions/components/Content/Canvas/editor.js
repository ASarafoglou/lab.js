import React, { Component } from 'react'
import { LocalForm, actions } from 'react-redux-form'
import { FormGroup } from 'reactstrap'
import { fromPairs, isObject, omit, uniqueId } from 'lodash'

import { AddDropDown, Style, Dimensions, Layers } from './form'

import FabricCanvas from './fabric'
import { fromCanvas, toCanvas } from './logic'

const trulyUniqueId = (existingIds=[]) => {
  let candidate = uniqueId()

  // Make sure no ids are used multiple times
  while (existingIds.includes(candidate)) {
    candidate = uniqueId()
  }

  return candidate
}

const prepareData = data => {
  const existingIds = data
    .map(c => c.id)
    .filter(id => id !== undefined)

  const output = data.map(c => {
    // Add new id where not already present
    if (c.id) {
      return [c.id, c]
    } else {
      const newId = trulyUniqueId(existingIds)
      existingIds.push(newId)
      c.id = newId
      return [c.id, c]
    }
  })

  return [
    fromPairs(output), // Object with id => data mapping
    output.map(o => o[0]) // Array of ids in order
  ]
}

const emptyFormData = {
  left: '', top: '', angle: '',
  width: '', height: '',
}

export default class CanvasEditor extends Component {
  constructor(...args) {
    super(...args)

    const [data, order] = prepareData(this.props.data)
    this.state = {
      data, order,
      selection: undefined,
    }
    this.updateState = this.updateState.bind(this)
  }

  setState(data) {
    super.setState(data, () => {
      this.updateForm()
      this.updateState()
    })
  }

  updateState() {
    this.props.onChange(
      this.canvas.canvas._objects.map(o => this.state.data[o.id])
    )
  }

  // Selection -----------------------------------------------------------------

  set selection(id) {
    this.setState({ selection: id })
    if (id === undefined) {
      this.formDispatch(
        actions.change('local', emptyFormData)
      )
    }
  }

  get selection() {
    return this.state.data[this.state.selection] || { type: undefined }
  }

  // User action handlers ------------------------------------------------------

  addContent(target) {
    this.updateContent(target, false)
    this.updateOrder()
    this.selection = target.id
  }

  deleteContent(target) {
    this.setState({ data: omit(this.state.data, [target.id]) })
    this.selection = undefined
  }

  updateContent(target, updateCanvas=true) {
    // Save the updated object in editor state,
    // after converting it into a raw object
    if (target.id) {
      this.setState({
        data: {
          ...this.state.data,
          [target.id]: target
        }
      })

      // Reflect modification on canvas
      if (updateCanvas) {
        this.canvas.modifyActive('set', toCanvas(target))
      }
    }
  }

  updateOrder() {
    this.setState({ order: this.canvas.canvas._objects.map(o => o.id) })
  }

  // Form data handling --------------------------------------------------------

  // TODO: Think about merging this with the updateContent
  updateFromForm(formData) {
    const newData = { ...formData }

    this.updateContent({
      ...newData,
      id: this.state.selection,
    }, true) // also update canvas
  }

  updateForm() {
    if (this.formDispatch) {
      this.formDispatch(
        actions.change(
          'local', this.selection,
          { silent: true }
        )
      )
    }
  }

  uniqueId() {
    return trulyUniqueId(this.state.order)
  }

  render() {
    const selection = this.selection

    return <div>
      <FabricCanvas
        data={ this.state.order.map(id => toCanvas(this.state.data[id])) }
        ref={ c => this.canvas = c }
        addHandler={ ({ target }) => this.addContent(target.toObject(['id'])) }
        deleteHandler={ ({ target }) => this.deleteContent(target) }
        updateHandler={ ({ target }) => {
          this.updateContent(
            fromCanvas(
              target.toObject(['id']),
              this.state.data[target.id],
            ),
            false,
          )
        } }
        updateSelectionHandler={ ({ target }) => this.selection = target.id }
        clearSelectionHandler={ () => this.selection = undefined }
        idSource={ () => this.uniqueId() }
      />
      <hr />
      <LocalForm
        initialState={ selection }
        onChange={ data => this.updateFromForm(data) }
        getDispatch={ dispatch => this.formDispatch = dispatch }
      >
        <FormGroup className="toolbar d-flex">
          <AddDropDown
            addHandler={ (...args) => this.canvas.add(...args) }
            removeHandler={ () => this.canvas.modifyActive('remove') }
            cloneHandler={ () => this.canvas.cloneActive() }
          />
          <Layers
            type={ selection.type }
            upHandler={ () => {
              this.canvas.modifyActive('bringForward')
              // The canvas does not signal this modification,
              // so trigger update manually
              this.updateOrder()
            } }
            downHandler={ () => {
              this.canvas.modifyActive('sendBackwards')
              this.updateOrder()
            } }
          />
          <Dimensions
            type={ selection.type }
          />
          <Style
            type={ selection.type }
            selection={ selection }
            changeHandler={ (attr, value) => {
              if (isObject(attr)) {
                this.formDispatch(actions.merge(`local`, attr))
              } else {
                this.formDispatch(actions.change(`local.${ attr }`, value))
              }
            } }
          />
        </FormGroup>
      </LocalForm>
    </div>
  }
}
