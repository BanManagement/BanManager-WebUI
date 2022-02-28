import Link from 'next/link'
import { AiOutlineCopy } from 'react-icons/ai'
import Avatar from '../Avatar'

export default function PlayerReportLocation ({ location, player }) {
  const command = `/tppos ${location.x} ${location.y} ${location.z} ${location.pitch} ${location.yaw} ${location.world}`

  return (
    <li className='py-4'>
      <div className='flex items-center space-x-4'>
        <div className='flex-shrink-0'>
          <Avatar uuid={player.id} width='28' height='28' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium'>
            <Link href={`/player/${player.id}`}>
              <a>
                {player.name}
              </a>
            </Link>
          </p>
          <pre className='text-sm text-gray-400 truncate overflow-y-auto'>{command}</pre>
        </div>
        <div className='inline-flex items-center text-base'>
          <AiOutlineCopy
            className='w-6 h-6 hover:text-accent-600 cursor-pointer'
            onClick={() => { navigator.clipboard.writeText(command) }}
          />
        </div>
      </div>
    </li>
  )
}
