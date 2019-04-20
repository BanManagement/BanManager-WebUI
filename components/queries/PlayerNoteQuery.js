import { Component } from 'react'
import gql from 'graphql-tag'
import { compose, graphql } from 'react-apollo'
import {
  Loader
} from 'semantic-ui-react'
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
        }
        acl {
          notes {
            create
            update
          }
        }
      }
    }
  }
`

const editQuery = gql`
  query playerNote($id: ID!, $serverId: ID!) {
    playerNote(id: $id, serverId: $serverId) {
      id
      message
      created
      player {
        id
        name
      }
    }
  }
`

const createMutation = gql`
  mutation createPlayerNote($input: CreatePlayerNoteInput!) {
    createPlayerNote(input: $input) {
      id
      message
    }
  }
`

const editMutation = gql`
  mutation updatePlayerNote($id: ID!, $serverId: ID!, $input: UpdatePlayerNoteInput!) {
    updatePlayerNote(id: $id, serverId: $serverId, input: $input) {
      id
      message
    }
  }
`

class PlayerNoteQuery extends Component {
  handleUpdate = async (e, { id, message, player: { id: playerId } }) => {
    e.preventDefault()

    const serverId = this.props.server

    await this.props.UpdatePlayerNoteMutation({ editMutation, variables: { id, serverId, input: { message } }, refetchQueries: [ 'player' ] })

    return this.props.onUpdate(playerId)
  }

  handleCreate = async (e, { server, message, player: { id: player } }) => {
    e.preventDefault()

    await this.props.CreatePlayerNoteMutation({ createMutation, variables: { input: { message, player, server } }, refetchQueries: [ 'player' ] })

    return this.props.onUpdate(player)
  }

  render() {
    if (this.props.data && this.props.data.error) return <GraphQlErrorMessage error={this.props.data.error} />
    if (this.props.data && !(this.props.data.playerNote || this.props.data.player)) return <Loader active />

    return this.props.children(this.props.data, { handleCreate: this.handleCreate, handleUpdate: this.handleUpdate })
  }
}

export default compose(
  graphql(createMutation, { name: 'CreatePlayerNoteMutation' })
, graphql(editMutation, { name: 'UpdatePlayerNoteMutation' })
, graphql(createQuery,
  { options: ({ id }) => ({ variables: { id }})
  , skip: ({ server }) => !!server
  })
, graphql(editQuery,
  { options: ({ id, server }) => ({ variables: { id, serverId: server } })
  , skip: ({ server }) => !server
  })
)(PlayerNoteQuery)
