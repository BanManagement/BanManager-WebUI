import { Fragment, useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Loader from '../Loader'
import { useApi, useUser } from '../../utils'
import { LOCALE_CONFIG, DEFAULT_LOCALE } from '../../utils/locale'
import { useDateFnsLocale } from '../../utils/format-distance'
import ServerSelector from '../admin/ServerSelector'
import { TimeDuration } from '../Time'
import { format, fromUnixTime } from 'date-fns'
import PlayerLastSeen from './PlayerLastSeen'
import Modal from '../Modal'
import Button from '../Button'
import Link from 'next/link'

const limit = 30

export default function PlayerHistoryList ({ id, lastSeen }) {
  const t = useTranslations()
  const locale = useLocale()
  const dateFnsLocale = useDateFnsLocale()
  const dateFormat = LOCALE_CONFIG[locale]?.dateFormat || LOCALE_CONFIG[DEFAULT_LOCALE].dateFormat
  const { hasPermission, hasServerPermission } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [tableState, setTableState] = useState({ offset: 0, serverId: null })
  const [rows, setRows] = useState([])
  const { loading, data } = useApi({
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
    variables: { ...tableState, limit, player: id }
  })
  const total = useMemo(() => data?.listPlayerSessionHistory.total || 0, [data])

  useEffect(() => {
    if (data?.listPlayerSessionHistory?.records) {
      setRows(prevRows => [...prevRows, ...data.listPlayerSessionHistory.records])
    }
  }, [data])

  const observer = useRef()
  const lastElementRef = useRef()

  const handleObserver = useCallback((entities) => {
    const target = entities[0]

    if (target.isIntersecting && tableState.offset + limit < total) {
      setTableState(prev => ({ ...prev, offset: prev.offset + limit }))
    } else if (target.isIntersecting && tableState.offset + limit >= total && tableState.offset < total) {
      setTableState(prev => ({ ...prev, offset: total }))
    }
  }, [tableState.offset, total])
  useEffect(() => {
    observer.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    })
    if (lastElementRef.current) {
      observer.current.observe(lastElementRef.current)
    }
    return () => {
      if (lastElementRef.current) {
        observer.current.unobserve(lastElementRef.current)
      }
    }
  }, [lastElementRef.current, total, handleObserver, tableState.serverId])

  const rowsGroupedByDate = useMemo(() => rows?.reduce((acc, { id, ...row }) => {
    let date

    try {
      date = format(fromUnixTime(row.join), dateFormat, dateFnsLocale ? { locale: dateFnsLocale } : undefined)
    } catch {
      date = format(fromUnixTime(row.join), dateFormat)
    }

    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push({ id, row })
    return acc
  }, {}), [rows, dateFormat, dateFnsLocale])

  return (
    <>
      <Modal
        title={t('pages.player.history')}
        open={isOpen}
        cancelButton={t('pages.player.close')}
        onCancel={() => setIsOpen(false)}
        containerClassName='md:max-w-3xl'
      >
        <ServerSelector onChange={serverId => {
          setRows([])
          setTableState({ ...tableState, serverId, offset: 0 })
        }}
        />
        <div className='flex flex-col overflow-auto -mb-5 mt-2'>
          {loading && <Loader />}
          {Object.entries(rowsGroupedByDate).map(([date, rows]) => (
            <Fragment key={date}>
              <div className='font-semibold p-2'>{date}</div>
              {rows.map(({ id, row }) => (
                <Fragment key={id}>
                  <div className='flex'>
                    <div className='flex-1 p-2'>{format(fromUnixTime(row.join), 'HH:mm:ss')}</div>
                    {hasServerPermission('player.ips', 'view', null, true) && <div className='flex-shrink p-2'>{row.ip}</div>}
                    <div className='flex-3 p-2 text-gray-400'><TimeDuration startTimestamp={row.join} endTimestamp={row.leave} /></div>
                  </div>
                </Fragment>
              ))}
            </Fragment>
          ))}
          {!loading && rows.length === 0 && (
            <>
              <div className='p-2 text-center text-gray-400'>{t('pages.player.noHistory')}</div>
              {hasPermission('servers', 'manage') &&
                <div className='p-2 text-center text-gray-400'>
                  {t.rich('pages.player.missingDataLine', {
                    docs: (chunks) => (
                      <Link target='_blank' href='https://banmanagement.com/docs/banmanager/configuration/config-yml#logips' rel='noreferrer'>
                        <pre className='inline'>{chunks}</pre>
                      </Link>
                    )
                  })}
                </div>}
            </>)}
          <div ref={lastElementRef} />
        </div>
      </Modal>
      <Button className='bg-primary-900 text-gray-400 font-normal' onClick={() => setIsOpen(true)}><PlayerLastSeen lastSeen={lastSeen} /></Button>
    </>
  )
}
