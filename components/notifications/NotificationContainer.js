import clsx from 'clsx'
import Link from 'next/link'
import { formatDistanceStrict, fromUnixTime } from 'date-fns'
import Avatar from '../Avatar'
import { formatDistanceLocale } from '../../utils/format-distance'

export default function NotificationContainer ({ id, actor, created, children, state }) {
  const className = clsx(`
    hover:bg-primary-400
    pr-6
    pl-3
    pt-4
    flex
    `,
  {
    'border-accent-600': state === 'unread'
  })

  let label

  try {
    label = formatDistanceStrict(fromUnixTime(created), new Date(), {
      addSuffix: false,
      locale: { formatDistance: formatDistanceLocale }
    })
  } catch (e) {
    label = created
  }

  return (
    <Link
      href={`/api/notifications/${id}`}
      prefetch={false}
      data-cy='notification-link'
      data-cy-notification-id={id}
      data-cy-notification-state={state}
    >
      <div className={className}>
        <div className='w-24 flex items-start'>
          <div className='flex gap-3'>
            <span className={clsx('rounded-full w-2 h-2 self-center', { 'bg-accent-500': state === 'unread' })} />
            <Avatar uuid={actor.id} width={40} height={40} className='w-10 h-10' />
          </div>
        </div>
        <div className='ml-2 md:ml-0 w-full'>
          {children}
        </div>
        <div className='w-6 justify-end'>
          <p className='text-gray-400 text-xs mr-3'>{label}</p>
        </div>
      </div>
    </Link>
  )
}
