import { useState } from 'react'
import Loader from './Loader'
import Pagination from './Pagination'
import Table from './Table'
import { format, fromUnixTime } from 'date-fns'
import { useApi, useUser } from '../utils'
import ServerSelector from './admin/ServerSelector'

export default function PlayerHistoryList ({ id, color }) {
  const { hasServerPermission } = useUser()
  const limit = 10
  const [tableState, setTableState] = useState({ activePage: 1, limit, offset: 0, serverId: null, player: id })
  const { loading, data, errors } = useApi({
    query: !tableState.serverId
      ? null
      : `query listPlayerSessionHistory($serverId: ID!, $player: UUID, $limit: Int, $offset: Int) {
      listPlayerSessionHistory(serverId: $serverId, player: $player, limit: $limit, offset: $offset) {
        total
        records {
          id
          join
          leave
          ${hasServerPermission('player.ips', 'view', null, true) ? 'ip' : ''}
        }
      }
    }`,
    variables: tableState
  })

  const handlePageChange = ({ activePage }) => setTableState({ ...tableState, activePage, offset: (activePage - 1) * limit })
  const total = data?.listPlayerSessionHistory.total || 0
  const rows = data?.listPlayerSessionHistory?.records || []
  const totalPages = Math.ceil(total / limit)
  const dateFormat = 'yyyy-MM-dd HH:mm:ss'

  if (errors) return null

  return (
    <div>
      <h1
        style={{ borderColor: `${color}` }}
        className='text-2xl font-bold pb-4 mb-4 border-b border-accent-200 leading-none'
      >
        <div className='flex items-center'>
          <p className='mr-6'>History</p>
          <div className='w-40 inline-block'>
            <ServerSelector
              onChange={serverId => setTableState({ ...tableState, serverId })}
            />
          </div>
        </div>
      </h1>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Joined</Table.HeaderCell>
            <Table.HeaderCell>Left</Table.HeaderCell>
            {hasServerPermission('player.ips', 'view', null, true) && <Table.HeaderCell>IP</Table.HeaderCell>}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading
            ? <Table.Row><Table.Cell colSpan='6'><Loader active inline='centered' /></Table.Cell></Table.Row>
            : rows.map((row, i) => (
              <Table.Row key={i}>
                <Table.Cell>{format(fromUnixTime(row.join), dateFormat)}</Table.Cell>
                <Table.Cell>{format(fromUnixTime(row.leave), dateFormat)}</Table.Cell>
                {hasServerPermission('player.ips', 'view', null, true) && <Table.Cell className={row.ip.length > 10 ? 'md:break-all' : ''}>{row.ip}</Table.Cell>}
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
    </div>
  )
}
