import Link from 'next/link'
import { format, fromUnixTime } from 'date-fns'
import { useLocale } from 'next-intl'
import Avatar from '../Avatar'
import { LOCALE_CONFIG, DEFAULT_LOCALE } from '../../utils/locale'
import { useDateFnsLocale } from '../../utils/format-distance'

export default function PlayerReportCommand ({ command }) {
  const locale = useLocale()
  const dateFnsLocale = useDateFnsLocale()
  const dateFormat = `${LOCALE_CONFIG[locale]?.dateFormat || LOCALE_CONFIG[DEFAULT_LOCALE].dateFormat} HH:mm:ss`

  let formatted

  try {
    formatted = format(fromUnixTime(command.created), dateFormat, dateFnsLocale ? { locale: dateFnsLocale } : undefined)
  } catch {
    formatted = format(fromUnixTime(command.created), dateFormat)
  }

  return (
    <li>
      <div className='flex items-center space-x-4'>
        <div className='flex-shrink-0'>
          <Avatar uuid={command.actor.id} width='28' height='28' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium'>
            <Link href={`/player/${command.actor.id}`}>

              {command.actor.name}

            </Link>
            <span className='text-xs text-gray-400 ml-1'>{formatted}</span>
          </p>
          <pre className='text-sm text-gray-400 truncate overflow-y-auto'>/{command.command} {command.args}</pre>
        </div>
      </div>
    </li>
  )
}
