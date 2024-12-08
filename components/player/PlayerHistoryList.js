import { Fragment, useMemo, useState, useEffect, useRef, useCallback } from 'react'
import Loader from '../Loader'
import { useApi, useUser } from '../../utils'
import ServerSelector from '../admin/ServerSelector'
import { TimeDuration } from '../Time'
import { format, fromUnixTime } from 'date-fns'
import PlayerLastSeen from './PlayerLastSeen'
import Modal from '../Modal'
import Button from '../Button'
import Link from 'next/link'

const limit = 30

export default function PlayerHistoryList ({ id, lastSeen }) {
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
    const date = format(fromUnixTime(row.join), 'dd MMM yyyy')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push({ id, row })
    return acc
  }, {}), [rows])

  return (
    <>
      <Modal
        title='History'
        open={isOpen}
        cancelButton='Close'
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
              <div className='p-2 text-center text-gray-400'>No history</div>
              {hasPermission('servers', 'manage') && <div className='p-2 text-center text-gray-400'>If you&apos;re missing data here, ensure <Link target='_blank' href='https://banmanagement.com/docs/banmanager/configuration/config-yml#logips' rel='noreferrer'><pre className='inline'>logIps</pre></Link> is enabled in the plugin&apos;s config.yml file</div>}
            </>)}
          <div ref={lastElementRef} />
        </div>
      </Modal>
      <Button className='bg-primary-900 text-gray-400 font-normal' onClick={() => setIsOpen(true)}><PlayerLastSeen lastSeen={lastSeen} /></Button>
    </>
  )
}
