import { useState } from 'react'
import { format, fromUnixTime } from 'date-fns'
import { useTranslations } from 'next-intl'
import Badge from '../Badge'
import Link from 'next/link'
import Loader from '../Loader'
import Avatar from '../Avatar'
import Table from '../Table'
import Pagination from '../Pagination'
import PlayerSelector from '../admin/PlayerSelector'
import Select from '../Select'
import PlayerAppealBadge from '../appeals/PlayerAppealBadge'
import { fromNow, useApi, useUser } from '../../utils'

const query = `
  query listPlayerAppeals($id: UUID, $assigned: UUID, $state: ID, $limit: Int, $offset: Int) {
    listPlayerAppeals(actor: $id, assigned: $assigned, state: $state, limit: $limit, offset: $offset) {
      total
      records {
        id
        created
        updated
        punishmentType
        punishmentReason
        state {
          id
          name
        }
        assignee {
          id
          name
        }
        actor {
          id
          name
        }
      }
    }
    appealStates {
      id
      name
    }
  }`

const AppealRow = ({ row, dateFormat, showActor }) => {
  return (
    <Table.Row>
      <Table.Cell>
        <Link href={`/appeals/${row.id}`} passHref>
          <Badge className='bg-accent-500 sm:mx-auto'>#{row.id}</Badge>
        </Link>
      </Table.Cell>
      {showActor &&
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
        </Table.Cell>}
      <Table.Cell>
        <PlayerAppealBadge appeal={row} />
      </Table.Cell>
      <Table.Cell>{format(fromUnixTime(row.created), dateFormat)}</Table.Cell>
      <Table.Cell>{row.state.name}</Table.Cell>
      <Table.Cell>
        {row.assignee &&
          <Link href={`/player/${row.assignee.id}`} passHref>

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

          </Link>}
      </Table.Cell>
      <Table.Cell>{fromNow(row.updated)}</Table.Cell>
    </Table.Row>
  )
}

export default function PlayerAppeals ({ id, title, showActor }) {
  const t = useTranslations()
  const { hasPermission } = useUser()
  const [tableState, setTableState] = useState({ id, serverId: null, activePage: 1, limit: 10, offset: 0, assigned: null, state: null })
  const { loading, data } = useApi({ query, variables: tableState })

  if (loading) return <Loader />

  const handlePageChange = ({ activePage }) => setTableState({ ...tableState, activePage, offset: (activePage - 1) * tableState.limit })
  const dateFormat = 'yyyy-MM-dd HH:mm:ss'
  const total = data?.listPlayerAppeals?.total || 0
  const totalPages = Math.ceil(total / tableState.limit)

  return (
    <>
      <h1
        className='text-lg font-bold pb-4 border-b border-accent-200 leading-none'
        data-cy='dashboard-widget-player-appeals'
      >
        <div className='flex items-center'>
          <p className='mr-6' data-cy='dashboard-widget-title'>{title}</p>
          {(hasPermission('player.appeals', 'view.any') || hasPermission('player.appeals', 'view.assigned')) &&
            <div className='ml-3 text-sm'>
              <Link href='/dashboard/appeals' data-cy='dashboard-widget-view-all'>{t('pages.dashboard.viewAll')}</Link>
            </div>}
        </div>
      </h1>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t('tables.id')}</Table.HeaderCell>
            {showActor &&
              <Table.HeaderCell>
                <PlayerSelector
                  multiple={false}
                  onChange={(id) => setTableState({ ...tableState, id })}
                  placeholder={t('tables.by')}
                  clearable
                />
              </Table.HeaderCell>}
            <Table.HeaderCell>{t('tables.type')}</Table.HeaderCell>
            <Table.HeaderCell>{t('tables.at')}</Table.HeaderCell>
            <Table.HeaderCell>
              <Select
                options={data?.appealStates?.map(state => ({ value: state.id, label: state.name }))}
                onChange={(value) => setTableState({ ...tableState, state: value?.value })}
                placeholder={t('tables.state')}
                isClearable
              />
            </Table.HeaderCell>
            <Table.HeaderCell>
              <PlayerSelector
                multiple={false}
                onChange={(id) => setTableState({ ...tableState, assigned: id })}
                placeholder={t('tables.assigned')}
                clearable
              />
            </Table.HeaderCell>
            <Table.HeaderCell>{t('tables.lastUpdated')}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading
            ? <Table.Row><Table.Cell colSpan='6'><Loader /></Table.Cell></Table.Row>
            : data?.listPlayerAppeals?.records?.map((row, i) => (<AppealRow showActor={showActor} serverId={tableState.serverId} row={row} dateFormat={dateFormat} key={i} />))}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan={showActor ? 7 : 6} border={false}>
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
