import React from 'react'

import { Control } from 'react-redux-form'
import { Col, FormGroup, Label } from 'reactstrap'

import Form from '../Form'
import Card from '../../../Card'

export default ({ id, data }) =>
  <Card title="Content">
    <Form
      id={ id }
      data={ data }
      keys={ ['shuffle'] }
    >
      <FormGroup row>
        <Col xs={2}>
          <Label
            style={{
              paddingTop: '0', // This is a hack to override .col-form-label
            }}
          >
            Order
          </Label>
        </Col>
        <Col xs={10}>
          <FormGroup check>
            <Label check>
              <Control.checkbox
                model=".shuffle"
                className="form-check-input"
              />
              &thinsp;
              Shuffle
            </Label>
          </FormGroup>
        </Col>
      </FormGroup>
    </Form>
  </Card>
