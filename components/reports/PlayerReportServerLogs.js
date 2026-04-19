import { useState, Fragment, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Modal from '../Modal'
import { format, fromUnixTime } from 'date-fns'
import Button from '../Button'
import { LOCALE_CONFIG, DEFAULT_LOCALE } from '../../utils/locale'
import { useDateFnsLocale } from '../../utils/format-distance'

export default function PlayerReportServerLogs ({ serverLogs }) {
  const t = useTranslations('pages.report')
  const locale = useLocale()
  const dateFnsLocale = useDateFnsLocale()
  const dateFormat = LOCALE_CONFIG[locale]?.dateFormat || LOCALE_CONFIG[DEFAULT_LOCALE].dateFormat
  const [isOpen, setIsOpen] = useState(false)

  if (!serverLogs?.length) {
    return null
  }

  const logsGroupedByDate = useMemo(() => serverLogs?.reduce((acc, { id, log }) => {
    let date

    try {
      date = format(fromUnixTime(log.created), dateFormat, dateFnsLocale ? { locale: dateFnsLocale } : undefined)
    } catch {
      date = format(fromUnixTime(log.created), dateFormat)
    }

    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push({ id, log })
    return acc
  }, {}), [serverLogs, dateFormat, dateFnsLocale])

  return (
    <>
      <Modal
        title={t('serverLogs')}
        open={isOpen}
        cancelButton={t('close')}
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
      <p className='text-sm text-gray-400 pb-3'>{t('reportRecords', { count: serverLogs?.length })}</p>
      <Button className='bg-primary-900 text-gray-400 font-normal' onClick={() => setIsOpen(true)}>{t('reviewLogs')}</Button>
    </>
  )
}
