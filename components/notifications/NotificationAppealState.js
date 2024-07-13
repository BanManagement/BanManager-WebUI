import { useUser } from '../../utils'
import PlayerAppealBadge from '../appeals/PlayerAppealBadge'
import NotificationContainer from './NotificationContainer'

export default function NotificationAppealState ({ id, actor, created, state, appeal }) {
  const { user } = useUser()

  return (
    <NotificationContainer id={id} actor={actor} created={created} state={state}>
      <p className='text-sm'>
        {appeal.actor.id === user?.id
          ? <>{actor.name} <span className='font-semibold'>{appeal.state.name === 'Open' ? 'opened' : appeal.state.name.toLowerCase()}</span> your appeal</>
          : <>{actor.name} <span className='font-semibold'>{appeal.state.name === 'Open' ? 'opened' : appeal.state.name.toLowerCase()}</span> appeal</>}
      </p>
      <div className='flex items-center gap-3'>
        <PlayerAppealBadge appeal={appeal} className='text-sm'>#{appeal.id}</PlayerAppealBadge>
        <blockquote className='px-3 text-ellipsis line-clamp-1 my-4 border-s-2 border-gray-400 text-gray-400'>{appeal.reason}</blockquote>
      </div>
    </NotificationContainer>
  )
}
