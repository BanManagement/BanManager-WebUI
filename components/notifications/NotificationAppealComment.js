import { useUser } from '../../utils'
import PlayerAppealBadge from '../appeals/PlayerAppealBadge'
import NotificationContainer from './NotificationContainer'

export default function NotificationAppealComment ({ id, actor, created, comment, state, appeal }) {
  const { user } = useUser()

  return (
    <NotificationContainer id={id} actor={actor} created={created} state={state}>
      <p className='text-sm'>
        {appeal.actor.id === user?.id
          ? <>{actor.name} commented on your appeal</>
          : <><span className='font-semibold'>{actor.name}</span> added a comment</>}
      </p>
      <div className='flex justify-start items-center gap-3'>
        <PlayerAppealBadge appeal={appeal} className='text-sm'>#{appeal.id}</PlayerAppealBadge>
        <blockquote className='px-3 text-ellipsis line-clamp-1 my-4 border-s-2 border-gray-400 text-gray-400'>{comment.content}</blockquote>
      </div>
    </NotificationContainer>
  )
}
