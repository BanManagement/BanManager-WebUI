import React from 'react'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'
import PropTypes from 'prop-types'
import {
  Loader
} from 'semantic-ui-react'
import GraphQLErrorMessage from 'components/GraphQLErrorMessage'

const query = gql`
  query reports($actor: UUID, $assigned: UUID, $player: UUID, $state: ID, $limit: Int) {
    reports(actor: $actor, assigned: $assigned, player: $player, state: $state, limit: $limit) {
      id
      reason
      created
      updated
      server {
        id
      }
      actor {
        id
        name
      }
      state {
        name
      }
      player {
        id
        name
      }
    }
  }
`

class ReportsQuery extends React.Component {
  render() {
    if (this.props.data && this.props.data.error) return <GraphQLErrorMessage error={this.props.data.error} />
    if (this.props.data && !this.props.data.reports) return <Loader active />

    return this.props.children(this.props.data)
  }
}

ReportsQuery.propTypes = {
  data: PropTypes.object.required
, children: PropTypes.func.required
}

export default graphql(query)(ReportsQuery)
