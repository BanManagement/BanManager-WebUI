import Link from 'next/link'
import { BiUser } from 'react-icons/bi'
import Avatar from '../Avatar'
import { fromNow } from '../../utils'

export default function PlayerAppealCommentAssigned ({ id, actor, created, assignee }) {
  return (
    <div className='ml-4 pt-3 pb-3 pl-4 relative' id={`comment-${id}`}>
      <span className='flex w-8 h-8 items-center justify-center rounded-full bg-gray-600 text-gray-300 float-left -ml-8 mr-2'>
        <BiUser className='w-6 h-6 inline-block' />
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
        </Link> assigned&nbsp;
        <Link href={`/player/${assignee.id}`}>
          <a className=''>
            {assignee.name}
          </a>
        </Link>
        &nbsp;{fromNow(created)}
      </span>
    </div>
  )
}
