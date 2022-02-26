import { format, fromUnixTime } from 'date-fns'
import Link from 'next/link'
import Loader from '../Loader'
import Avatar from '../Avatar'
import Badge from '../Badge'
import Table from '../Table'
import { fromNow, useApi } from '../../utils'

const query = `
query playerBans($id: UUID!) {
  playerBans(player: $id) {
    id
    actor {
      id
      name
    }
    reason
    created
    expires
    server {
      id
      name
    }
  }
  playerMutes(player: $id) {
    id
    actor {
      id
      name
    }
    reason
    created
    expires
    server {
      id
      name
    }
  }
}`

const PunishmentRow = ({ row, dateFormat }) => {
  return (
    <Table.Row>
      <Table.Cell>{row.typeLabel}</Table.Cell>
      <Table.Cell><p>{row.reason}</p></Table.Cell>
      <Table.Cell>
        <Link href={`/player/${row.actor.id}`} passHref>
          <a>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <Avatar uuid={row.actor.id} height='26' width='26' />
              </div>
              <div className='ml-3'>
                <p className='whitespace-no-wrap'>
                  {row.actor.name}
                </p>
              </div>
            </div>
          </a>
        </Link>
      </Table.Cell>
      <Table.Cell>{format(fromUnixTime(row.created), dateFormat)}</Table.Cell>
      <Table.Cell>{row.expires === 0 ? <Badge className='bg-red-500 sm:mx-auto'>Permanent</Badge> : fromNow(row.expires)}</Table.Cell>
      <Table.Cell>
        <Link href={`/player/appeal/${row.server.id}/${row.id}/${row.type}`} passHref>
          <a>
            <Badge className='bg-blue-600 hover:bg-blue-900 mt-4'>
              Appeal
            </Badge>
          </a>
        </Link>
      </Table.Cell>
    </Table.Row>
  )
}

export default function ActivePunishments ({ id }) {
  const { loading, data, errors } = useApi({ query, variables: { id } })

  if (loading) return <Loader />
  if (errors || !data || (!data.playerBans && !data.playerMutes)) return null

  const dateFormat = 'yyyy-MM-dd HH:mm:ss'
  let rows = []

  if (data?.playerBans?.length) {
    rows = rows.concat(data.playerBans.map(data => ({ type: 'ban', typeLabel: <Badge className='bg-red-500 sm:mx-auto'>Ban</Badge>, ...data })))
  }

  if (data?.playerMutes?.length) {
    rows = rows.concat(data.playerMutes.map(data => ({ type: 'mute', typeLabel: <Badge className='bg-indigo-500 sm:mx-auto'>Mute</Badge>, ...data })))
  }

  rows.sort((a, b) => b.created - a.created)

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Type</Table.HeaderCell>
          <Table.HeaderCell>Reason</Table.HeaderCell>
          <Table.HeaderCell>By</Table.HeaderCell>
          <Table.HeaderCell>At</Table.HeaderCell>
          <Table.HeaderCell>Length</Table.HeaderCell>
          <Table.HeaderCell />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {loading
          ? <Table.Row><Table.Cell colSpan='6'><Loader /></Table.Cell></Table.Row>
          : rows.map((row, i) => (<PunishmentRow row={row} dateFormat={dateFormat} key={i} />))}
      </Table.Body>
    </Table>
  )
}
