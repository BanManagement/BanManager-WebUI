import React from 'react'
import gql from 'graphql-tag'
import { compose, graphql } from 'react-apollo'
import {
  Loader
} from 'semantic-ui-react'
import GraphQlErrorMessage from '../GraphQLErrorMessage'

const createQuery = gql`
  query serverTables {
    serverTables
  }
`

const editQuery = gql`
  query server($id: ID!) {
    serverTables
    server(id: $id) {
      id
      name
      host
      port
      database
      user
      console {
        id
      }
      tables {
        players
        playerBans
        playerBanRecords
        playerMutes
        playerMuteRecords
        playerKicks
        playerNotes
        playerHistory
        playerPins
        playerReports
        playerReportCommands
        playerReportComments
        playerReportLocations
        playerReportStates
        playerReportLogs
        serverLogs
        playerWarnings
        ipBans
        ipBanRecords
        ipMutes
        ipMuteRecords
        ipRangeBans
        ipRangeBanRecords
      }
    }
  }
`

const createMutation = gql`
  mutation createServer($input: CreateServerInput!) {
    createServer(input: $input) {
      id
    }
  }
`

const editMutation = gql`
  mutation updateServer($id: ID!, $input: UpdateServerInput!) {
    updateServer(id: $id, input: $input) {
      id
    }
  }
`

class ServerQuery extends React.Component {
  handleUpdate = async (e, { id, name, console, host, port, database, user, password, tables }) => {
    e.preventDefault()

    await this.props.UpdateServerMutation({ editMutation, variables: { id, input: { name, console, host, port, database, user, password, tables } }, refetchQueries: [ 'servers' ] })

    return this.props.onUpdate()
  }

  handleCreate = async (e, { name, console, host, port, database, user, password, tables }) => {
    e.preventDefault()

    await this.props.CreateServerMutation({ createMutation, variables: { input: { name, console, host, port, database, user, password, tables } }, refetchQueries: [ 'servers' ] })

    return this.props.onUpdate()
  }

  render () {
    if (this.props.data && this.props.data.error) return <GraphQlErrorMessage error={this.props.data.error} />
    if (this.props.data && !(this.props.data.serverTables || this.props.data.server)) return <Loader active />

    return this.props.children(this.props.data, { handleCreate: this.handleCreate, handleUpdate: this.handleUpdate })
  }
}

export default compose(
  graphql(createQuery)
  , graphql(createMutation, { name: 'CreateServerMutation' })
  , graphql(editMutation, { name: 'UpdateServerMutation' })
  , graphql(editQuery,
    { options: ({ id }) => ({ variables: { id } }),
      skip: ({ id }) => !id
    })
)(ServerQuery)
