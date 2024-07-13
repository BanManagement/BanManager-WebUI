import NotificationContainer from './NotificationContainer'
import PlayerAppealBadge from '../appeals/PlayerAppealBadge'
import { useUser } from '../../utils'

export default function NotificationReportState ({ id, actor, created, state, report }) {
  const { user } = useUser()

  return (
    <NotificationContainer id={id} actor={actor} created={created} state={state}>
      <p className='text-sm'>
        {report.actor.id === user?.id
          ? <>{actor.name} <span className='font-semibold'>{report.state.name === 'Open' ? 'opened' : report.state.name.toLowerCase()}</span> your report</>
          : <>{actor.name} <span className='font-semibold'>{report.state.name === 'Open' ? 'opened' : report.state.name.toLowerCase()}</span> report</>}
      </p>
      <div className='flex items-center gap-3'>
        <PlayerAppealBadge appeal={{}} className='text-sm'>#{report.id}</PlayerAppealBadge>
        <blockquote className='px-3 text-ellipsis line-clamp-1 my-4 border-s-2 border-gray-400 text-gray-400'>{report.reason}</blockquote>
      </div>
    </NotificationContainer>
  )
}
