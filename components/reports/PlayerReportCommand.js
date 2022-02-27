import Link from 'next/link'
import { format, fromUnixTime } from 'date-fns'
import Avatar from '../Avatar'

export default function PlayerReportCommand ({ command }) {
  return (
    <li className='py-4'>
      <div className='flex items-center space-x-4'>
        <div className='flex-shrink-0'>
          <Avatar uuid={command.actor.id} width='28' height='28' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium'>
            <Link href={`/player/${command.actor.id}`}>
              <a>
                {command.actor.name}
              </a>
            </Link>
            <span className='text-xs text-gray-400 ml-1'>{format(fromUnixTime(command.created), 'dd MMM yyyy HH:mm:ss')}</span>
          </p>
          <pre className='text-sm text-gray-400 truncate overflow-y-auto'>/{command.command} {command.args}</pre>
        </div>
      </div>
    </li>
  )
}
