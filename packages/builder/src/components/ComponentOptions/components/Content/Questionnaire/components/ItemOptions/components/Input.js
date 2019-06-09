import React from 'react'

import { Control } from 'react-redux-form'
import { Row, Col, Input } from 'reactstrap'

export default () =>
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
        <Control.textarea
          model=".help"
          placeholder="Help"
          component={ Input }
          controlProps={{ type: 'textarea', bsSize: 'sm', rows: 1 }}
          className="mt-2 text-muted"
          style={{ padding: '6px 12px' }}
        />
      </Col>
    </Row>
  </>
