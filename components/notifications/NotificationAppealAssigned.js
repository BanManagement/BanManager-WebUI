import { BiUser } from 'react-icons/bi'
import clsx from 'clsx'
import Link from 'next/link'
import Avatar from '../Avatar'
import { fromNow } from '../../utils'

export default function NotificationAppealAssigned ({ id, actor, created, state, appeal }) {
  return (
    <Link href={`/api/notifications/${id}`} prefetch={false}>
      <a>
        <div className={clsx('bg-black border-black border-l-2 border-r-2 hover:bg-gray-900', { 'border-accent-600': state === 'unread', 'hover:border-gray-900': state === 'read' })}>
          <div className='flex pl-2 py-2 border-b border-accent-200'>
            <div className='flex-col mt-1 mr-2'>
              <div className='flex-shrink-0 text-center items-start'>
                <BiUser className='w-4 h-4 text-accent-500' />
              </div>
            </div>
            <div className='flex-auto space-y-1'>
              <p className={clsx('text-xs break-all', { 'text-gray-400': state === 'read' })}>{appeal?.reason} appeal #{appeal?.id}</p>
              <div className='break-words'>
                <span className='align-middle inline-flex'>
                  <Avatar uuid={actor.id} width={20} height={20} />
                </span>
                <span className='pl-1 text-sm text-gray-400'>
                  {actor.name} assigned {appeal.assignee.name}
                </span>
              </div>
            </div>
            <p className='flex-shrink-0 text-gray-400 text-xs mr-3'>{fromNow(created)}</p>
          </div>
        </div>
      </a>
    </Link>
  )
}
