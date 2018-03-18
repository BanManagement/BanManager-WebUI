import { Component } from 'react'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'
import {
  Loader
} from 'semantic-ui-react'
import GraphQLErrorMessage from '../GraphQLErrorMessage'

const query = gql`
  query servers {
    servers {
      id
      name
    }
  }
`

class ServersQuery extends Component {
  render() {
    if (this.props.data && this.props.data.error) return <GraphQLErrorMessage error={this.props.data.error} />
    if (this.props.data && !this.props.data.servers) return <Loader active />

    return this.props.children(this.props.data)
  }
}

export default graphql(query)(ServersQuery)
