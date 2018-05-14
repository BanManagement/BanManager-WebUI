import React from 'react'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { Loader } from 'semantic-ui-react'

const query = gql`
  query {
    me {
      id
      name
      hasAccount
      session {
        type
      }
    }
  }
`

export default ComposedComponent => {
  class WithSession extends React.Component {
    constructor(props, context) {
      super(props, context)
    }

    static async getInitialProps(ctx) {
      if (ComposedComponent.getInitialProps) {
        return await ComposedComponent.getInitialProps(ctx)
      }

      return {}
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

    get hasAccount() {
      return !!this.props.data.me.hasAccount
    }

    get type() {
      return this.props.data.me.session.type
    }

    render() {
      if (this.props.data && this.props.data.loading) return <Loader active />

      return <ComposedComponent {...this.props} session={this} />
    }
  }

  return graphql(query, {
    options: { errorPolicy: 'ignore' }
  })(WithSession)
}
