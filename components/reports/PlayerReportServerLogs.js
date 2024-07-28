import { useState, Fragment, useMemo } from 'react'
import Modal from '../Modal'
import { format, fromUnixTime } from 'date-fns'
import Button from '../Button'

export default function PlayerReportServerLogs ({ serverLogs }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!serverLogs?.length) {
    return null
  }

  const logsGroupedByDate = useMemo(() => serverLogs?.reduce((acc, { id, log }) => {
    const date = format(fromUnixTime(log.created), 'dd MMM yyyy')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push({ id, log })
    return acc
  }, {}), [serverLogs])

  return (
    <>
      <Modal
        title='Server Logs'
        open={isOpen}
        cancelButton='Close'
        onCancel={() => setIsOpen(false)}
        containerClassName='md:max-w-3xl'
      >
        <div className='flex flex-col overflow-auto'>
          {Object.entries(logsGroupedByDate).map(([date, logs]) => (
            <Fragment key={date}>
              <div className='font-semibold px-2 py-2'>{date}</div>
              {logs.map(({ id, log }) => (
                <Fragment key={id}>
                  <div className='flex text-xs'>
                    <pre className='flex-1 px-2 py-2 text-gray-400'>{format(fromUnixTime(log.created), 'HH:mm:ss')}</pre>
                    <pre className='flex-3 px-2 py-2 whitespace-pre-line'>{log.message}</pre>
                  </div>
                </Fragment>
              ))}
            </Fragment>
          ))}
        </div>
      </Modal>
      <p className='text-sm text-gray-400 pb-3'>This report has {serverLogs?.length} records associated with it</p>
      <Button className='bg-primary-900 text-gray-400 font-normal' onClick={() => setIsOpen(true)}>Review Logs</Button>
    </>
  )
}
