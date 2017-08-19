import React, { Component } from 'react'
import { Card as BaseCard, CardHeader, CardBlock } from 'reactstrap'

class Card extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isOpen: props.open !== false
    }
  }

  render() {
    const { title, children, collapsable, wrapContent } = this.props
    const content = wrapContent !== false
      ? <CardBlock>{ children }</CardBlock>
      : children

    return <BaseCard
        style={ this.props.style }
        className="my-1"
      >
      {
        title
          ? <CardHeader
              style={{
                fontWeight: 500,
                borderBottomStyle: (this.state.isOpen ? 'solid' : 'none'),
              }}
              onClick={ () => {
                if (collapsable) this.setState({ isOpen: !this.state.isOpen })
              } }
            >
              { title }
            </CardHeader>
          : null
      }
      { this.state.isOpen ? content : null }
    </BaseCard>
  }
}

export default Card
