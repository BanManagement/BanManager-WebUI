import React from 'react'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'
import PropTypes from 'prop-types'
import {
  Loader
} from 'semantic-ui-react'
import GraphQLErrorMessage from 'components/GraphQLErrorMessage'

export const query = gql`
  query listReports($actor: UUID, $assigned: UUID, $player: UUID, $state: ID, $limit: Int) {
    listReports(actor: $actor, assigned: $assigned, player: $player, state: $state, limit: $limit) {
      total
      reports {
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
          id
          name
        }
        player {
          id
          name
        }
        assignee {
          id
          name
        }
      }
    }
  }
`

class ReportsQuery extends React.Component {
  render () {
    if (this.props.data && this.props.data.error) return <GraphQLErrorMessage error={this.props.data.error} />
    if (this.props.data && !this.props.data.listReports) return <Loader active />

    return this.props.children(this.props.data)
  }
}

ReportsQuery.propTypes = {
  data: PropTypes.object.isRequired,
  children: PropTypes.func.isRequired
}

export default graphql(query)(ReportsQuery)
