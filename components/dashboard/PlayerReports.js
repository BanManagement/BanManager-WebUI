import { useState } from 'react'
import { format, fromUnixTime } from 'date-fns'
import Badge from '../Badge'
import Link from 'next/link'
import Loader from '../Loader'
import Avatar from '../Avatar'
import Table from '../Table'
import Pagination from '../Pagination'
import ServerSelector from '../admin/ServerSelector'
import { fromNow, useApi, useUser } from '../../utils'

const query = `
  query listPlayerReports($serverId: ID!, $id: UUID, $assigned: UUID, $player: UUID, $state: ID, $limit: Int, $offset: Int) {
    listPlayerReports(serverId: $serverId, actor: $id, assigned: $assigned, player: $player, state: $state, limit: $limit, offset: $offset) {
      total
      records {
        id
        created
        updated
        state {
          id
          name
        }
        player {
          id
          name
        }
        assignee {
          id
          name
        }
      }
    }
  }`

const ReportRow = ({ serverId, row, dateFormat }) => {
  return (
    <Table.Row>
      <Table.Cell>
        <Link href={`/reports/${serverId}/${row.id}`} passHref>
          <a>
            <Badge className='bg-accent-500 sm:mx-auto'>#{row.id}</Badge>
          </a>
        </Link>
      </Table.Cell>
      <Table.Cell>
        <Link href={`/player/${row.player.id}`} passHref>
          <a>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <Avatar uuid={row.player.id} height='26' width='26' />
              </div>
              <div className='ml-3'>
                <p className='whitespace-no-wrap'>
                  {row.player.name}
                </p>
              </div>
            </div>
          </a>
        </Link>
      </Table.Cell>
      <Table.Cell>{format(fromUnixTime(row.created), dateFormat)}</Table.Cell>
      <Table.Cell>{row.state.name}</Table.Cell>
      <Table.Cell>
        {row.assignee &&
          <Link href={`/player/${row.assignee.id}`} passHref>
            <a>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <Avatar uuid={row.assignee.id} height='26' width='26' />
                </div>
                <div className='ml-3'>
                  <p className='whitespace-no-wrap'>
                    {row.assignee.name}
                  </p>
                </div>
              </div>
            </a>
          </Link>}
      </Table.Cell>
      <Table.Cell>{fromNow(row.updated)}</Table.Cell>
    </Table.Row>
  )
}

export default function PlayerReports ({ id, title }) {
  const { hasPermission } = useUser()
  const [tableState, setTableState] = useState({ id, serverId: null, activePage: 1, limit: 10, offset: 0, actor: null, assigned: null, state: null })
  const { loading, data } = useApi({ query: !tableState.serverId ? null : query, variables: tableState })

  if (loading) return <Loader />

  const handlePageChange = ({ activePage }) => setTableState({ ...tableState, activePage, offset: (activePage - 1) * tableState.limit })
  const dateFormat = 'yyyy-MM-dd HH:mm:ss'
  const total = data?.listPlayerSessionHistory?.total || 0
  const totalPages = Math.ceil(total / tableState.limit)

  return (
    <>
      <h1
        className='text-lg font-bold pb-4 border-b border-accent-200 leading-none'
      >
        <div className='flex items-center'>
          <p className='mr-6'>{title}</p>
          <div className='w-40 inline-block'>
            <ServerSelector
              onChange={serverId => setTableState({ ...tableState, serverId })}
            />
          </div>
          {(hasPermission('player.reports', 'view.any') || hasPermission('player.reports', 'view.assigned')) &&
            <div className='ml-3 text-sm'>
              <Link href='/dashboard/reports'>View All</Link>
            </div>}
        </div>
      </h1>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>ID</Table.HeaderCell>
            <Table.HeaderCell>Player</Table.HeaderCell>
            <Table.HeaderCell>At</Table.HeaderCell>
            <Table.HeaderCell>State</Table.HeaderCell>
            <Table.HeaderCell>Assigned</Table.HeaderCell>
            <Table.HeaderCell>Last Updated</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading
            ? <Table.Row><Table.Cell colSpan='6'><Loader /></Table.Cell></Table.Row>
            : data?.listPlayerReports?.records?.map((row, i) => (<ReportRow serverId={tableState.serverId} row={row} dateFormat={dateFormat} key={i} />))}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan='6' border={false}>
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
