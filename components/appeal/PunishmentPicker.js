import Loader from '../Loader'
import { useApi, useUser } from '../../utils'
import Button from '../Button'
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import AppealPunishment from './AppealPunishment'

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
    server {
      id
      name
    }
    acl {
      yours
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
    server {
      id
      name
    }
    acl {
      yours
    }
  }
  playerWarnings(player: $id) {
    id
    actor {
      id
      name
    }
    reason
    created
    server {
      id
      name
    }
    acl {
      yours
    }
  }
}`

const typesConfig = [
  { type: 'ban', colours: 'bg-red-800 hover:bg-red-900' },
  { type: 'mute', colours: 'bg-indigo-800 hover:bg-indigo-900' },
  { type: 'warning', colours: 'bg-amber-800 hover:bg-amber-900' }
]

export default function PunishmentPicker () {
  const t = useTranslations()
  const { user } = useUser()
  const { loading, data } = useApi({ query, variables: { id: user?.id } })
  const [activeFilter, setActiveFilter] = useState(['ban', 'mute', 'warning'])

  const toggleFilter = type => {
    if (activeFilter.includes(type)) {
      setActiveFilter(activeFilter.filter(t => t !== type))
    } else {
      setActiveFilter([...activeFilter, type])
    }
  }

  let rows = []

  if (data?.playerBans?.length && activeFilter.includes('ban')) {
    rows = rows.concat(data.playerBans.map(data => ({ type: 'ban', ...data })))
  }

  if (data?.playerMutes?.length && activeFilter.includes('mute')) {
    rows = rows.concat(data.playerMutes.map(data => ({ type: 'mute', ...data })))
  }

  if (data?.playerWarnings?.length && activeFilter.includes('warning')) {
    rows = rows.concat(data.playerWarnings.map(data => ({ type: 'warning', ...data })))
  }

  const items = rows.map((row) => (
    <div
      key={row.server.id + row.id + row.type}
      data-cy='punishment-picker-item'
      data-cy-punishment-type={row.type}
      data-cy-punishment-id={row.id}
      data-cy-server-id={row.server.id}
    >
      <AppealPunishment punishment={row} appealable />
    </div>
  ))
  const filters = useMemo(() => typesConfig.map(({ type, colours }) => (
    <Button
      key={type}
      className={clsx(colours, { 'border-opacity-0 opacity-50': !activeFilter.includes(type) })}
      onClick={() => toggleFilter(type)}
      data-cy={`punishment-picker-filter-${type}`}
    >
      {t(`pages.player.actions.${type}`)}
    </Button>
  )), [activeFilter])

  if (loading) return <Loader className='relative h-9 w-9 mb-2' />

  return (
    <div data-cy='punishment-picker'>
      <div className='flex flex-row gap-4 mb-4'>
        {filters}
      </div>
      <div className='flex flex-col gap-4 pt-4'>
        {(!data || !rows.length)
          ? (
            <div data-cy='punishment-picker-empty'>
              <h2 className='text-center text-base font-semibold leading-relaxed pb-1'>{t('pages.appeal.noPunishments')}</h2>
              <p className='text-center text-sm font-normal leading-snug pb-4'>{t('pages.appeal.tryChangingFilters')}</p>
              <div className='flex gap-3'>
                <Button onClick={() => setActiveFilter(['ban', 'mute', 'warning'])} data-cy='punishment-picker-clear-filters'>{t('pages.appeal.clearFilters')}</Button>
              </div>
            </div>
            )
          : items}
      </div>
    </div>
  )
}
