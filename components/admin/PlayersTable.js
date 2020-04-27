import React, { useEffect, useState } from 'react'
import { Form, Image, Loader, Pagination, Table } from 'semantic-ui-react'
import PlayerEditForm from './PlayerEditForm'
import { useApi } from '../../utils'

const query = `
query listUsers($email: String, $role: String, $serverRole: String, $limit: Int, $offset: Int) {
  listUsers(email: $email, role: $role, serverRole: $serverRole, limit: $limit, offset: $offset) {
    total
    records {
      id
      player {
        name
      }
      email
      roles {
        role {
          id
          name
        }
      }
      serverRoles {
        serverRole {
          id
          name
        }
        server {
          id
        }
      }
    }
  }
}`

export default function PlayersTable ({ limit = 30, roles, servers }) {
  const [tableState, setTableState] = useState({ activePage: 1, limit, offset: 0, email: '', role: '', serverRole: '' })
  const [editState, setEditState] = useState({ playerEditOpen: false, currentPlayer: null })
  const { load, loading, data } = useApi({ query, variables: tableState }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })

  useEffect(() => {
    load()
  }, [tableState])

  const handlePageChange = (e, { activePage }) => setTableState({ ...tableState, activePage, offset: (activePage - 1) * limit })
  const handleOpen = player => () => setEditState({ playerEditOpen: true, currentPlayer: player })
  const handleplayerEditFinished = (updated) => {
    setEditState({ playerEditOpen: false, currentPlayer: null })

    if (updated) load()
  }
  const handleFilter = (e, { name, value }) => setTableState({ ...tableState, [name]: value })
  const rows = data?.listUsers?.records || []
  const total = data?.listUsers.total || 0
  const totalPages = Math.ceil(total / limit)

  return (
    <>
      <PlayerEditForm
        player={editState.currentPlayer}
        roles={roles}
        servers={servers}
        open={editState.playerEditOpen}
        onFinished={handleplayerEditFinished}
      />
      <Table selectable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell><Form.Input name='email' placeholder='Email' value={tableState.email} onChange={handleFilter} /></Table.HeaderCell>
            <Table.HeaderCell><Form.Input name='role' placeholder='Global Roles' value={tableState.role} onChange={handleFilter} /></Table.HeaderCell>
            <Table.HeaderCell><Form.Input name='serverRole' placeholder='Server Roles' value={tableState.serverRole} onChange={handleFilter} /></Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading
            ? <Table.Row><Table.Cell colSpan='4'><Loader active inline='centered' /></Table.Cell></Table.Row>
            : rows.map((row, i) => (
              <Table.Row key={i}>
                <Table.Cell>
                  <a onClick={handleOpen(row)}>
                    <Image src={`https://crafatar.com/avatars/${row.id}?size=26&overlay=true`} fluid avatar />
                    {row.player.name}
                  </a>
                </Table.Cell>
                <Table.Cell>{row.email}</Table.Cell>
                <Table.Cell>{row.roles.map(({ role }) => role.name).join(', ')}</Table.Cell>
                <Table.Cell>{row.serverRoles.map(({ serverRole }) => serverRole.name).join(', ')}</Table.Cell>
              </Table.Row>
            ))}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan='4'>
              <Pagination
                fluid
                totalPages={totalPages}
                activePage={tableState.activePage}
                onPageChange={handlePageChange}
              />
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </>
  )
}
