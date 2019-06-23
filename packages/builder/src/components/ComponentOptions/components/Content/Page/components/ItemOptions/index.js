import React from 'react'

import Text from './components/Text'
import Divider from './components/Divider'
import Raw from './components/Raw'
import Input from './components/Input'
import Radio from './components/Radio'
import Checkbox from './components/Checkbox'

const selectItem = (type) => {
  switch(type) {
    case 'text':
      return Text
    case 'divider':
      return Divider
    case 'html':
      return Raw
    case 'input':
    case 'textarea':
      return Input
    case 'radio':
      return Radio
    case 'checkbox':
      return Checkbox
    default:
      return null
  }
}

export default (props) => {
  const Item = selectItem(props.type)
  return <Item { ...props } />
}
