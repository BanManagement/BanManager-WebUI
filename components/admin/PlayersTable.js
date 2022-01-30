import { useState } from 'react'
import Input from '../Input'
import Table from '../Table'
import Pagination from '../Pagination'
import Loader from '../Loader'
import PlayerEditForm from './PlayerEditForm'
import { useApi } from '../../utils'
import Avatar from '../Avatar'

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
  const { loading, data, mutate } = useApi({ query, variables: tableState })

  const handlePageChange = ({ activePage }) => setTableState({ ...tableState, activePage, offset: (activePage - 1) * limit })
  const handleOpen = player => () => setEditState({ playerEditOpen: true, currentPlayer: player })
  const handleplayerEditFinished = ({ setRoles }) => {
    setEditState({ playerEditOpen: false, currentPlayer: null })

    if (setRoles) {
      const records = data.listUsers.records.slice()
      const index = records.findIndex(p => p.id === setRoles.id)

      if (index) {
        records[index] = setRoles
      } else {
        records.push(setRoles)
      }

      mutate({ ...data, listUsers: { ...data.listUsers, records } })
    }
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
        onCancel={() => setEditState({ playerEditOpen: false, currentPlayer: null })}
      />
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell><Input className='mb-0' inputClassName='!text-sm' name='email' placeholder='Email' value={tableState.email} onChange={handleFilter} /></Table.HeaderCell>
            <Table.HeaderCell><Input className='mb-0' inputClassName='!text-sm' name='role' placeholder='Global Roles' value={tableState.role} onChange={handleFilter} /></Table.HeaderCell>
            <Table.HeaderCell><Input className='mb-0' inputClassName='!text-sm' name='serverRole' placeholder='Server Roles' value={tableState.serverRole} onChange={handleFilter} /></Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading
            ? <Table.Row><Table.Cell colSpan='5'><Loader /></Table.Cell></Table.Row>
            : rows.map((row, i) => (
              <Table.Row key={i}>
                <Table.Cell>
                  <a href='#' className='text-accent-600 hover:text-accent-100' onClick={handleOpen(row)}>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0'>
                        <Avatar uuid={row.id} height='26' width='26' />
                      </div>
                      <div className='ml-3'>
                        <p className='whitespace-no-wrap'>
                          {row.player.name}
                        </p>
                      </div>
                    </div>
                  </a>
                </Table.Cell>
                <Table.Cell><p className='px-4'>{row.email}</p></Table.Cell>
                <Table.Cell><p className='px-4'>{row.roles.map(({ role }) => role.name).join(', ')}</p></Table.Cell>
                <Table.Cell><p className='px-4'>{row.serverRoles.map(({ serverRole }) => serverRole.name).join(', ')}</p></Table.Cell>
                <Table.Cell>
                  <a href='#' className='text-accent-600 hover:text-accent-100' onClick={handleOpen(row)}>
                    Edit
                  </a>
                </Table.Cell>
              </Table.Row>
            ))}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan='5' border={false}>
              <Pagination
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
