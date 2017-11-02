import React, { Component } from 'react'
import { Popover, PopoverHeader, PopoverContent } from 'reactstrap'
import { uniqueId } from 'lodash'

import './hint.css'

const HintTarget = ({ id, onClick }) =>
  <span id={ id } onClick={ onClick }>
    <i className="fa fa-info-circle hint-icon"
      aria-hidden="true" title="More information"></i>
    <span className="sr-only">More information</span>
  </span>

export default class HintPopover extends Component {
  constructor(props) {
    super(props)

    this.id = this.props.id || uniqueId('hint_')
    this.target = this.props.target || HintTarget

    this.toggle = this.toggle.bind(this)
    this.state = {
      isOpen: false,
    }
  }

  toggle() {
    this.setState({
      isOpen: !this.state.isOpen,
    })
  }

  render() {
    const Target = this.target

    return (
      <span className={ this.props.className } style={ this.props.style }>
        {' '}
        <Target id={ this.id } onClick={ this.toggle } />
        <Popover
          target={ this.id }
          placement={ this.props.placement || "bottom" }
          isOpen={ this.state.isOpen } toggle={ this.toggle }
        >
          <PopoverHeader>{ this.props.title }</PopoverHeader>
          <PopoverContent>{ this.props.children }</PopoverContent>
        </Popover>
      </span>
    )
  }
}
