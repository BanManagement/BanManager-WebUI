import { format, fromUnixTime } from 'date-fns'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations()
  return (
    <Table.Row>
      <Table.Cell>{row.typeLabel}</Table.Cell>
      <Table.Cell><p>{row.reason}</p></Table.Cell>
      <Table.Cell>
        <Link href={`/player/${row.actor.id}`} passHref>

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

        </Link>
      </Table.Cell>
      <Table.Cell>{format(fromUnixTime(row.created), dateFormat)}</Table.Cell>
      <Table.Cell>{row.expires === 0 ? <Badge className='bg-red-500 sm:mx-auto'>{t('common.permanent')}</Badge> : fromNow(row.expires)}</Table.Cell>
      <Table.Cell>
        <Link href={`/appeal/punishment/${row.server.id}/${row.type}/${row.id}`} passHref>
          <Badge className='bg-blue-600 hover:bg-blue-900 mt-4'>
            {t('pages.punishment.appeal')}
          </Badge>
        </Link>
      </Table.Cell>
    </Table.Row>
  )
}

export default function ActivePunishments ({ id }) {
  const t = useTranslations()
  const { loading, data, errors } = useApi({ query, variables: { id } })

  if (loading) return <Loader />
  if (errors || !data || (!data.playerBans && !data.playerMutes)) return null

  const dateFormat = 'yyyy-MM-dd HH:mm:ss'
  let rows = []

  if (data?.playerBans?.length) {
    rows = rows.concat(data.playerBans.map(data => ({ type: 'ban', typeLabel: <Badge className='bg-red-500 sm:mx-auto'>{t('pages.player.actions.ban')}</Badge>, ...data })))
  }

  if (data?.playerMutes?.length) {
    rows = rows.concat(data.playerMutes.map(data => ({ type: 'mute', typeLabel: <Badge className='bg-indigo-500 sm:mx-auto'>{t('pages.player.actions.mute')}</Badge>, ...data })))
  }

  rows.sort((a, b) => b.created - a.created)

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{t('tables.type')}</Table.HeaderCell>
          <Table.HeaderCell>{t('tables.reason')}</Table.HeaderCell>
          <Table.HeaderCell>{t('tables.by')}</Table.HeaderCell>
          <Table.HeaderCell>{t('tables.at')}</Table.HeaderCell>
          <Table.HeaderCell>{t('tables.length')}</Table.HeaderCell>
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
