import React from 'react'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'
import {
  Loader
} from 'semantic-ui-react'
import GraphQLErrorMessage from 'components/GraphQLErrorMessage'

const query = gql`
  query roles {
    roles {
      id
      name
    }
  }
`

class RolesQuery extends React.Component {
  render() {
    if (this.props.data && this.props.data.error) return <GraphQLErrorMessage error={this.props.data.error} />
    if (this.props.data && !this.props.data.roles) return <Loader active />

    return this.props.children(this.props.data)
  }
}

export default graphql(query)(RolesQuery)
