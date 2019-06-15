import React from 'react'

import { Control } from 'react-redux-form'
import { Row, Col, Input, Collapse } from 'reactstrap'

import { ItemContext } from '../../../index'
import { BaseOptions } from './BaseOptions'

export default ({ rowIndex }) =>
  <>
    <Row form>
      <Col>
        <Control
          model=".label"
          placeholder="Question"
          component={ Input }
        />
      </Col>
    </Row>
    <Row form>
      <Col>
        <ItemContext.Consumer>
          {
            ({ openItem }) =>
              <Collapse isOpen={ openItem === rowIndex }>
                <BaseOptions
                  rowIndex={ rowIndex }
                />
              </Collapse>
          }
        </ItemContext.Consumer>
      </Col>
    </Row>
  </>
