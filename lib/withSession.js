import React from 'react'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

const query = gql`
  query {
    me {
      id
      name
    }
  }
`

export default ComposedComponent => {
  class WithSession extends React.Component {
    constructor(props, context) {
      super(props, context)
    }

    get exists() {
      return !!this.props.data.me
    }

    get id() {
      return this.props.data.me.id
    }

    get name() {
      return this.props.data.me.name
    }

    render() {
      return <ComposedComponent {...this.props} session={this} />
    }
  }

  return graphql(query, {
    options: { errorPolicy: 'ignore' }
  })(WithSession)
}
