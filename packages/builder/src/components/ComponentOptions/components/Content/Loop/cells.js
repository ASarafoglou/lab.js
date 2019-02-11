import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Control } from 'react-redux-form'

import './style.css'

import { InputGroupButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem,
  InputGroup } from 'reactstrap'
import classnames from 'classnames'

import Icon from '../../../../Icon'

export const GridCell = ({ cellData, rowIndex, colIndex, colName }) =>
  <Control.text
    model={ `.rows[${ rowIndex }][${ colIndex }]` }
    className="form-control"
    style={{
      fontFamily: 'Fira Mono',
    }}
    debounce={ 300 }
  />

export const CellTypeSelector = ({ type, setType,
  actions, disabled=false }) => {

  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <InputGroupButtonDropdown
      addonType="append"
      disabled={ disabled }
      isOpen={ dropdownOpen }
      toggle={ () => setDropdownOpen(!dropdownOpen) }
    >
      <DropdownToggle
        caret={ !disabled }
        disabled={ disabled }
        outline color="secondary"
        // Ensure that the right-hand side
        // always has rounded corners
        // (this didn't work if the button was disabled)
        className="rounded-right"
      >
        <Icon
          icon={{
            string: 'font',
            number: 'tachometer',
            boolean: 'adjust'
          }[type]}
          fixedWidth
        />
      </DropdownToggle>
      <DropdownMenu right>
        <DropdownItem header>Data type</DropdownItem>
        <DropdownItem
          className={ classnames({
            'dropdown-item-active': type === 'string'
          }) }
          onClick={ () => setType('string') }
        >
          Text <span className="text-muted">(categorical)</span>
        </DropdownItem>
        <DropdownItem
          className={ classnames({
            'dropdown-item-active': type === 'number'
          }) }
          onClick={ () => setType('number') }
        >
          Numerical <span className="text-muted">(continuous)</span>
        </DropdownItem>
        <DropdownItem
          className={ classnames({
            'dropdown-item-active': type === 'boolean'
          }) }
          onClick={ () => setType('boolean') }
        >
          Boolean <span className="text-muted">(binary)</span>
        </DropdownItem>
        {
          actions
            ? <div>
                <DropdownItem divider />
                <DropdownItem header>
                  Actions
                </DropdownItem>
                {
                  Object.entries(actions).map(([k, v], i) =>
                    <DropdownItem onClick={ v } key={ i }>
                      { k }
                    </DropdownItem>
                  )
                }
              </div>
            : <div></div>
        }
      </DropdownMenu>
    </InputGroupButtonDropdown>
  )
}

export const HeaderCell = ({ columnData, index }, { gridDispatch }) =>
  <InputGroup>
    <Control.text
      model={ `.columns[${ index }]['name']` }
      placeholder={ `parameter${ index }` }
      className="form-control"
      style={{
        fontFamily: 'Fira Mono',
        fontWeight: 'bold',
        height: '42px',
      }}
      debounce={ 300 }
    />
    <CellTypeSelector
      type={ columnData.type }
      setType={
        value => gridDispatch('change', {
          model: `local.templateParameters.columns[${ index }]['type']`,
          value
        })
      }
      actions={{
        'Delete': () => {
          if (window.confirm('Are you sure you want to delete this column?')) {
            gridDispatch('deleteColumn', index)
          }
        }
      }}
    />
  </InputGroup>

HeaderCell.contextTypes = {
  gridDispatch: PropTypes.func,
}
