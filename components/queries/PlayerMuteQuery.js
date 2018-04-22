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
          mutes {
            create
            update
          }
        }
      }
    }
  }
`

const editQuery = gql`
  query playerMute($id: ID!, $serverId: ID!) {
    playerMute(id: $id, serverId: $serverId) {
      id
      reason
      expires
      created
      soft
      player {
        id
        name
      }
    }
  }
`

const createMutation = gql`
  mutation createPlayerMute($input: CreatePlayerMuteInput!) {
    createPlayerMute(input: $input) {
      id
      reason
      expires
      soft
    }
  }
`

const editMutation = gql`
  mutation updatePlayerMute($id: ID!, $serverId: ID!, $input: UpdatePlayerMuteInput!) {
    updatePlayerMute(id: $id, serverId: $serverId, input: $input) {
      id
      reason
      expires
      soft
    }
  }
`

class PlayerMuteQuery extends React.Component {
  handleUpdate = async (e, { id, reason, expires, soft, player: { id: playerId } }) => {
    e.preventDefault()

    const serverId = this.props.server

    await this.props.updatePlayerMuteMutation({ editMutation, variables: { id, serverId, input: { reason, expires, soft } }, refetchQueries: [ 'player' ] })

    return this.props.onUpdate(playerId)
  }

  handleCreate = async (e, { server, reason, expires, soft, player: { id: player } }) => {
    e.preventDefault()

    await this.props.createPlayerMuteMutation({ createMutation, variables: { input: { reason, expires, player, server, soft } }, refetchQueries: [ 'player' ] })

    return this.props.onUpdate(player)
  }

  render() {
    if (this.props.data && this.props.data.error) return <GraphQlErrorMessage error={this.props.data.error} />
    if (this.props.data && !(this.props.data.playerBan || this.props.data.player)) return <Loader active />

    return this.props.children(this.props.data, { handleCreate: this.handleCreate, handleUpdate: this.handleUpdate })
  }
}

PlayerMuteQuery.propTypes = {
  data: PropTypes.object.isRequired
, server: PropTypes.string
, children: PropTypes.func.isRequired
, onUpdate: PropTypes.func
, updatePlayerMuteMutation: PropTypes.func
, createPlayerMuteMutation: PropTypes.func
}

export default compose(
  graphql(createMutation, { name: 'createPlayerMuteMutation' })
, graphql(editMutation, { name: 'updatePlayerMuteMutation' })
, graphql(createQuery,
  { options: ({ id }) => ({ variables: { id } })
  , skip: ({ server }) => !!server
  })
, graphql(editQuery,
  { options: ({ id, server }) => ({ variables: { id, serverId: server } })
  , skip: ({ server }) => !server
  })
)(PlayerMuteQuery)
