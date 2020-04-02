import React, { useEffect, useState } from 'react'
import { Header, Loader, Pagination, Table } from 'semantic-ui-react'
import { format, fromUnixTime } from 'date-fns'
import { useApi } from '../utils'
import ServerSelector from './admin/ServerSelector'

const query = `
query listSessionHistory($serverId: ID!, $player: UUID, $limit: Int, $offset: Int) {
  listSessionHistory(serverId: $serverId, player: $player, limit: $limit, offset: $offset) {
    total
    records {
      id
      join
      leave
      ip
      server {
        id
        name
      }
    }
  }
}`

export default function PlayerHistoryList ({ id }) {
  const limit = 10
  const [tableState, setTableState] = useState({ activePage: 1, limit, offset: 0, serverId: null, player: null })
  const { load, loading, data, errors } = useApi({ query, variables: tableState }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })

  useEffect(() => {
    if (tableState.serverId) load()
  }, [tableState])

  const handlePageChange = (e, { activePage }) => setTableState({ ...tableState, activePage, offset: (activePage - 1) * limit })
  const handleFieldChange = (field) => (id) => setTableState({ ...tableState, [field]: id || null })
  const total = data?.listSessionHistory.total || 0
  const rows = data?.listSessionHistory?.records || []
  const totalPages = Math.ceil(total / limit)
  const dateFormat = 'yyyy-MM-dd HH:mm:ss'

  if (errors) return null

  return (
    <>
      <Header>Player Session History</Header>
      <Table selectable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell><ServerSelector handleChange={handleFieldChange('serverId')} /></Table.HeaderCell>
            <Table.HeaderCell>Joined</Table.HeaderCell>
            <Table.HeaderCell>Left</Table.HeaderCell>
            <Table.HeaderCell>IP Address</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading
            ? <Table.Row><Table.Cell colSpan='6'><Loader active inline='centered' /></Table.Cell></Table.Row>
            : rows.map((row, i) => (
              <Table.Row key={i}>
                <Table.Cell>{row.server.name}</Table.Cell>
                <Table.Cell>{format(fromUnixTime(row.join), dateFormat)}</Table.Cell>
                <Table.Cell>{format(fromUnixTime(row.leave), dateFormat)}</Table.Cell>
                <Table.Cell>{row.ip}</Table.Cell>
              </Table.Row>
            ))}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan='6'>
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
