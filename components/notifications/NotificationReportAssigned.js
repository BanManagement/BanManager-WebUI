import { useUser } from '../../utils'
import PlayerAppealBadge from '../appeals/PlayerAppealBadge'
import NotificationContainer from './NotificationContainer'

export default function NotificationReportAssigned ({ id, actor, created, state, report }) {
  const { user } = useUser()

  return (
    <NotificationContainer id={id} actor={actor} created={created} state={state}>
      <p className='text-sm'>
        {report.actor.id === user?.id
          ? <>{actor.name} assigned <span className='font-semibold'>{report.assignee.name}</span> to review your report against {report.player.name}</>
          : <><span className='font-semibold'>{actor.name}</span> assigned <span className='font-semibold'>{report.assignee.name}</span> to review report</>}
      </p>
      <div className='flex items-center gap-3'>
        <PlayerAppealBadge appeal={{}} className='text-sm'>#{report.id}</PlayerAppealBadge>
        <blockquote className='px-3 text-ellipsis line-clamp-1 my-4 border-s-2 border-gray-400 text-gray-400'>{report.reason}</blockquote>
      </div>
    </NotificationContainer>
  )
}
