import Link from 'next/link'
import { GoInfo } from 'react-icons/go'
import Avatar from '../Avatar'
import { fromNow } from '../../utils'

export default function PlayerAppealCommentState ({ id, actor, created, state }) {
  return (
    <div className='ml-4 pt-3 pb-3 pl-4 relative' id={`comment-${id}`}>
      <span className='flex w-8 h-8 items-center justify-center rounded-full bg-primary-900 text-gray-200 float-left -ml-8 mr-2'>
        <GoInfo className='w-6 h-6 inline-block' />
      </span>
      <Link
        href={`/player/${actor.id}`}
        className='align-middle mx-1 inline-flex relative'
      >

        <Avatar uuid={actor.id} width={20} height={20} />

      </Link>
      <span className='pl-1 text-sm text-gray-300'>
        <Link href={`/player/${actor.id}`} className=''>

          {actor.name}

        </Link> marked this appeal as {state.name.toLowerCase()} {fromNow(created)}
      </span>
    </div>
  )
}
