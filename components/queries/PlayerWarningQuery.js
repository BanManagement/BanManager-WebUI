import React from 'react'
import gql from 'graphql-tag'
import { compose, graphql } from 'react-apollo'
import {
  Loader
} from 'semantic-ui-react'
import PropTypes from 'prop-types'
import GraphQlErrorMessage from '../GraphQLErrorMessage'

const createQuery = gql`
  query player($id: UUID!) {
    player(id: $id) {
      id
      name
      servers {
        server {
          id
          name
          timeOffset
        }
        acl {
          warnings {
            create
            update
          }
        }
      }
    }
  }
`

const editQuery = gql`
  query playerWarning($id: ID!, $serverId: ID!) {
    playerWarning(id: $id, serverId: $serverId) {
      id
      reason
      expires
      created
      points
      player {
        id
        name
      }
    }
  }
`

const createMutation = gql`
  mutation createPlayerWarning($input: CreatePlayerWarningInput!) {
    createPlayerWarning(input: $input) {
      id
      reason
      expires
      points
    }
  }
`

const editMutation = gql`
  mutation updatePlayerWarning($id: ID!, $serverId: ID!, $input: UpdatePlayerWarningInput!) {
    updatePlayerWarning(id: $id, serverId: $serverId, input: $input) {
      id
      reason
      expires
      points
    }
  }
`

class PlayerWarningQuery extends React.Component {
  handleUpdate = async (e, { id, reason, expires, points, player: { id: playerId } }) => {
    e.preventDefault()

    const serverId = this.props.server

    await this.props.updatePlayerWarningMutation({ editMutation, variables: { id, serverId, input: { reason, expires, points } }, refetchQueries: [ 'player' ] })

    return this.props.onUpdate(playerId)
  }

  handleCreate = async (e, { server, reason, expires, points, player: { id: player } }) => {
    e.preventDefault()

    await this.props.createPlayerWarningMutation({ createMutation, variables: { input: { reason, expires, player, server, points } }, refetchQueries: [ 'player' ] })

    return this.props.onUpdate(player)
  }

  render() {
    if (this.props.data && this.props.data.error) return <GraphQlErrorMessage error={this.props.data.error} />
    if (this.props.data && !(this.props.data.playerWarning || this.props.data.player)) return <Loader active />

    return this.props.children(this.props.data, { handleCreate: this.handleCreate, handleUpdate: this.handleUpdate })
  }
}

PlayerWarningQuery.propTypes = {
  data: PropTypes.object.isRequired
, server: PropTypes.string.isRequired
, children: PropTypes.array.isRequired
, onUpdate: PropTypes.func
, updatePlayerWarningMutation: PropTypes.func
, createPlayerWarningMutation: PropTypes.func
}

export default compose(
  graphql(createMutation, { name: 'createPlayerWarningMutation' })
, graphql(editMutation, { name: 'updatePlayerWarningMutation' })
, graphql(createQuery,
  { options: ({ id }) => ({ variables: { id } })
  , skip: ({ server }) => !!server
  })
, graphql(editQuery,
  { options: ({ id, server }) => ({ variables: { id, serverId: server } })
  , skip: ({ server }) => !server
  })
)(PlayerWarningQuery)
