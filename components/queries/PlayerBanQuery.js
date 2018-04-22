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
          bans {
            create
            update
          }
        }
      }
    }
  }
`

const editQuery = gql`
  query playerBan($id: ID!, $serverId: ID!) {
    playerBan(id: $id, serverId: $serverId) {
      id
      reason
      expires
      created
      player {
        id
        name
      }
    }
  }
`

const createMutation = gql`
  mutation createPlayerBan($input: CreatePlayerBanInput!) {
    createPlayerBan(input: $input) {
      id
      reason
      expires
    }
  }
`

const editMutation = gql`
  mutation updatePlayerBan($id: ID!, $serverId: ID!, $input: UpdatePlayerBanInput!) {
    updatePlayerBan(id: $id, serverId: $serverId, input: $input) {
      id
      reason
      expires
    }
  }
`

class PlayerBanQuery extends React.Component {
  handleUpdate = async (e, { id, reason, expires, player: { id: playerId } }) => {
    e.preventDefault()

    const serverId = this.props.server

    await this.props.updatePlayerBanMutation({ editMutation, variables: { id, serverId, input: { reason, expires } }, refetchQueries: [ 'player' ] })

    return this.props.onUpdate(playerId)
  }

  handleCreate = async (e, { server, reason, expires, player: { id: player } }) => {
    e.preventDefault()

    await this.props.createPlayerBanMutation({ createMutation, variables: { input: { reason, expires, player, server } }, refetchQueries: [ 'player' ] })

    return this.props.onUpdate(player)
  }

  render() {
    if (this.props.data && this.props.data.error) return <GraphQlErrorMessage error={this.props.data.error} />
    if (this.props.data && !(this.props.data.playerBan || this.props.data.player)) return <Loader active />

    return this.props.children(this.props.data, { handleCreate: this.handleCreate, handleUpdate: this.handleUpdate })
  }
}

PlayerBanQuery.propTypes = {
  data: PropTypes.object.isRequired
, server: PropTypes.string.isRequired
, children: PropTypes.func.isRequired
, onUpdate: PropTypes.func
, updatePlayerBanMutation: PropTypes.func
, createPlayerBanMutation: PropTypes.func
}

export default compose(
  graphql(createMutation, { name: 'createPlayerBanMutation' })
, graphql(editMutation, { name: 'updatePlayerBanMutation' })
, graphql(createQuery,
  { options: ({ id }) => ({ variables: { id } })
  , skip: ({ server }) => !!server
  })
, graphql(editQuery,
  { options: ({ id, server }) => ({ variables: { id, serverId: server } })
  , skip: ({ server }) => !server
  })
)(PlayerBanQuery)
