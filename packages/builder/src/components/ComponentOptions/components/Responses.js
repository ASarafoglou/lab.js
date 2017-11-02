import React from 'react'
import { Control } from 'react-redux-form'
import { CardBody, FormGroup, Col, Label } from 'reactstrap'

import Card from '../../Card'
import Grid from '../../Grid'
import Hint from '../../Hint'
import Form from './Form'

const GridCell = ({ cellData, rowIndex, colIndex, colName }) => {
  if (colIndex === 1) {
    return <Control.select
      model={ `.rows[${ rowIndex }][${ colIndex }]` }
      className="form-control custom-select"
      style={{
        fontFamily: 'Fira Mono',
        color: cellData === '' ? 'var(--gray)' : 'inherit',
      }}
    >
      <option value="">undefined</option>
      <option value="keypress">keypress</option>
      <option value="keydown">keydown</option>
      <option value="keyup">keyup</option>
      <option value="click">click</option>
      <option value="mousedown">mousedown</option>
      <option value="mouseup">mouseup</option>
    </Control.select>
  } else {
    const placeholder = colIndex === 2 ? 'window' : ''
    return <Control.text
      model={ `.rows[${ rowIndex }][${ colIndex }]` }
      placeholder={ placeholder }
      className="form-control"
      style={{
        fontFamily: 'Fira Mono',
      }}
      debounce={ 300 }
    />
  }
}

const HeaderCell = ({ columnData }) =>
  <span
    style={{
      paddingLeft: '0.25rem',
    }}
  >
    { columnData }
  </span>

const Content = ({ id, data, formDispatch }) =>
  <div>
    <Grid
      model=".responses"
      data={ data.responses.rows }
      columns={ ['label', 'type', 'target', 'filter'] }
      columnWidths={ [30, 20, 20, 20] }
      HeaderContent={ HeaderCell }
      BodyContent={ GridCell }
      formDispatch={ formDispatch }
    />
    <CardBody>
      <FormGroup row>
        <Label for="correctResponse" xs="2">
          Correct
          <Hint
            title="Correct response"
            className="pull-right"
          >
            <p className="font-weight-bold">
              Label of the response classified as correct.
            </p>
            <p className="text-muted">
              The entry here should correspond to one of the labels assigned to responses in the first column above.
            </p>
          </Hint>
        </Label>
        <Col xs="10">
          <Control
            model=".correctResponse"
            placeholder="Undefined"
            type="text"
            className="form-control" id="correctResponse"
            style={{
              fontFamily: 'Fira Mono',
            }}
            debounce={ 300 }
          />
        </Col>
      </FormGroup>
      <FormGroup row>
        <Label for="timeout" xs="2">
          Timeout
          <Hint
            title="Timeout"
            className="pull-right"
          >
            <p className="font-weight-bold">
              End component automatically after a given number of milliseconds.
            </p>
            <p className="text-muted">
              If responses are defined alongside a timeout, whichever comes first will end the component.
            </p>
          </Hint>
        </Label>
        <Col xs="10">
          <div className="input-group">
            <Control
              model=".timeout"
              placeholder="Never"
              pattern="(\d+)|(\$\{.*\})" // Accept number or placeholder
              className="form-control" id="timeout"
              style={{
                fontFamily: 'Fira Mono',
              }}
              debounce={ 300 }
            />
            <div className="input-group-addon text-muted">ms</div>
          </div>
        </Col>
      </FormGroup>
    </CardBody>
  </div>

export default ({ id, data }) =>
  <Card title="Responses" wrapContent={ false }>
    <Form
      id={ id }
      data={ data }
      keys={ ['responses', 'correctResponse', 'timeout'] }
      getDispatch={ dispatch => this.formDispatch = dispatch }
    >
      <Content
        id={ id }
        data={ data }
        formDispatch={ action => this.formDispatch(action) }
      />
    </Form>
  </Card>
