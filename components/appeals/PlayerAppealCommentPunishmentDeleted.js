import Link from 'next/link'
import { GoIssueClosed } from 'react-icons/go'
import Avatar from '../Avatar'
import PlayerAppealBadge from './PlayerAppealBadge'
import { fromNow } from '../../utils'

export default function PlayerAppealCommentPunishmentDeleted ({ appeal, id, actor, created, state }) {
  return (
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
        </Link> removed the <PlayerAppealBadge appeal={appeal} /> and marked this appeal as {state.name.toLowerCase()} {fromNow(created)}
      </span>
    </div>
  )
}
