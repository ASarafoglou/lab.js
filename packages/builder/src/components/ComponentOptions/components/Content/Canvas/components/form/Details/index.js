import React from 'react'

import { DropdownToggle } from 'reactstrap'

import DropDown from '../../../../../../../Dropdown'
import Icon from '../../../../../../../Icon'

import ImageOptions from './ImageOptions'
import TextOptions from './TextOptions'

import './index.css'

const icons = {
  'i-text': 'font',
  'image': 'image',
}

const Toggle = ({ type }) =>
  <DropdownToggle
    caret outline color="secondary"
    disabled={ !Object.keys(icons).includes(type) }
    style={{
      minWidth: '3.5rem',
    }}
  >
    <Icon icon={ icons[type] || 'cog' } />
  </DropdownToggle>

const Options = (props) => {
  switch(props.selection.type) {
    case 'i-text':
      return <TextOptions { ...props } />
    case 'image':
      return <ImageOptions { ...props } />
    default:
      return null
  }
}

export default ({ selection, changeHandler }) =>
  <DropDown
    direction="up"
    type="button"
  >
    <Toggle
      type={ selection.type }
    />
    <Options
      selection={ selection }
      changeHandler={ changeHandler }
    />
  </DropDown>
