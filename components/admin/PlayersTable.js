import 'react-table/react-table.css'
import React from 'react'
import ReactTable from 'react-table'
import { withApollo } from 'react-apollo'
import gql from 'graphql-tag'
import { Header, Image, Modal } from 'semantic-ui-react'
import PlayerEditForm from 'components/admin/PlayerEditForm'
import RolesQuery from 'components/queries/RolesQuery'

export const query = gql`
query listPlayers($email: String, $role: String, $serverRole: String, $limit: Int, $offset: Int) {
  listPlayers(email: $email, role: $role, serverRole: $serverRole, limit: $limit, offset: $offset) {
    total
    players {
      id
      name
      email
      roles {
        id
        name
      }
      serverRoles {
        role {
          id
          name
        }
        server {
          id
        }
      }
    }
  }
}
`

export const mutation = gql`
mutation setRoles($player: ID!, $input: SetRolesInput!) {
  setRoles(player: $player, input: $input) {
    id
    name
    email
    roles {
      id
      name
    }
    serverRoles {
      role {
        id
        name
      }
      server {
        id
      }
    }
  }
}
`

class PlayersTable extends React.Component {
  state = { data: [], loading: false, pages: -1, playerEditOpen: false, currentPlayer: {} }

  onPlayerUpdate = async (e, player, input) => {
    try {
      await this.props.client.mutate({ mutation, variables: { player, input } })
    } catch (error) {
      console.error(error)
    }

    this.handleClose()
  }

  handleOpen = player => () => this.setState({ playerEditOpen: true, currentPlayer: player })
  handleClose = () => this.setState({ playerEditOpen: false, currentPlayer: {} })

  render() {
    const { servers } = this.props
    const columns = [{
      Header: 'Name', accessor: 'name', filterable: false, Cell: row => (
        <a onClick={this.handleOpen(row.original)}>
          <Image src={`https://crafatar.com/avatars/${row.original.id}?size=26&overlay=true`} fluid avatar></Image>
          {row.value}
        </a>
      )
    }, {
      Header: 'Email', accessor: 'email', filterable: true
    }, {
      Header: 'Global Roles', accessor: 'role', filterable: true
    }, {
      Header: 'Server Roles', accessor: 'serverRole', filterable: true
    }]

    const { currentPlayer, data, loading, pages } = this.state

    return (
      <React.Fragment>
        <Modal
          open={this.state.playerEditOpen}
          onClose={this.handleClose}
        >
          <Header content={currentPlayer.name} />
          <Modal.Content>
            <RolesQuery>
              {({ roles }) => (
                <PlayerEditForm player={currentPlayer} servers={servers} roles={roles} onSubmit={this.onPlayerUpdate} />
              )}
            </RolesQuery>
          </Modal.Content>
        </Modal>
        <ReactTable
          data={data}
          loading={loading}
          columns={columns}
          pages={pages}
          manual
          minRows={0}
          showPageSizeOptions={false}
          showPageJump={false}
          resolveData={data => data.map(row => {
            return { ...row, role: row.roles.map(r => r.name).join(', '), serverRole: row.serverRoles.map(r => r.role.name).join(', ') }
          })}
          onFetchData={(state) => {
            this.setState({ loading: true })

            const { filtered, pageSize, page } = state
            const variables = { limit: pageSize, offset: page * pageSize }

            if (filtered.length) {
              filtered.forEach(filter => {
                variables[filter.id] = filter.value
              })
            }

            this.props.client.query({ query, variables })
              .then(({ data }) => {
                this.setState({
                  data: data.listPlayers.players,
                  pages: Math.ceil(data.listPlayers.total / pageSize),
                  loading: false
                })
              })
          }}
        />
      </React.Fragment>
    )
  }
}

export default withApollo(PlayersTable)
