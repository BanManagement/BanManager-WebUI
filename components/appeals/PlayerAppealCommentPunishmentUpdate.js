import Link from 'next/link'
import { GoIssueClosed, GoPencil, GoEyeClosed, GoEye, GoClock } from 'react-icons/go'
import { format, fromUnixTime } from 'date-fns'
import Avatar from '../Avatar'
import { fromNow } from '../../utils'

export default function PlayerAppealCommentPunishmentUpdate ({ id, actor, created, state, oldReason, newReason, oldExpires, newExpires, oldSoft, newSoft }) {
  const messages = []
  const expiryFormat = (expiry) => expiry === 0 ? 'permanent' : format(fromUnixTime(expiry), 'dd MMM yyyy HH:mm:ss')

  if (oldReason && newReason) {
    messages.push({
      message: <>changed the reason from <span className='font-bold line-through'>{oldReason}</span> to <span className='font-bold'>{newReason}</span></>
    })
  }

  if (typeof oldExpires === 'number' && typeof newExpires === 'number') {
    messages.push({
      icon: <GoClock className='w-6 h-6 inline-block' />,
      message: <>modified the expiration from <span className='font-bold line-through'>{expiryFormat(oldExpires)}</span> to <span className='font-bold'>{expiryFormat(newExpires)}</span></>
    })
  }

  if (typeof oldSoft === 'boolean' && typeof newSoft === 'boolean') {
    messages.push({
      icon: newSoft ? <GoEyeClosed className='w-6 h-6 inline-block' /> : <GoEye className='w-6 h-6 inline-block' />,
      message: <>set <span className='font-bold line-through'>{oldSoft ? 'shadow' : 'not shadow'}</span> to <span className='font-bold'>{newSoft ? 'shadow' : 'not shadow'}</span></>
    })
  }

  return (
    <>
      {messages
        .map(({ message, icon }, i) => (
          <div className='ml-4 pt-3 pb-3 pl-4 relative' key={`comment-${id}-${i}`} id={`comment-${id}-${i}`}>
            <span className='flex w-8 h-8 items-center justify-center rounded-full bg-gray-600 text-gray-300 float-left -ml-8 mr-2'>
              {icon || <GoPencil className='w-6 h-6 inline-block' />}
            </span>
            <Link href={`/player/${actor.id}`}>
              <a className='align-middle mx-1 inline-flex relative'>
                <Avatar uuid={actor.id} width={20} height={20} />
              </a>
            </Link>
            <span className='pl-1 text-sm text-gray-300'>
              <Link href={`/player/${actor.id}`}>
                <a className=''>
                  {actor.name}
                </a>
              </Link> {message}
            </span>
          </div>
        ))}
      <div className='ml-4 pt-3 pb-3 pl-4 relative' id={`comment-${id}`}>
        <span className='flex w-8 h-8 items-center justify-center rounded-full bg-gray-600 text-gray-300 float-left -ml-8 mr-2'>
          <GoIssueClosed className='w-6 h-6 inline-block' />
        </span>
        <Link href={`/player/${actor.id}`}>
          <a className='align-middle mx-1 inline-flex relative'>
            <Avatar uuid={actor.id} width={20} height={20} />
          </a>
        </Link>
        <span className='pl-1 text-sm text-gray-300'>
          <Link href={`/player/${actor.id}`}>
            <a className=''>
              {actor.name}
            </a>
          </Link> marked this appeal as {state.name.toLowerCase()} {fromNow(created)}
        </span>
      </div>
    </>
  )
}
