import { useTranslations } from 'next-intl'
import { useUser } from '../../utils'
import PlayerAppealBadge from '../appeals/PlayerAppealBadge'
import NotificationContainer from './NotificationContainer'

export default function NotificationReportAssigned ({ id, actor, created, state, report }) {
  const t = useTranslations('notifications')
  const { user } = useUser()
  const ownReport = report.actor.id === user?.id
  const messageKey = ownReport ? 'reportAssignedOwn' : 'reportAssignedOther'

  return (
    <NotificationContainer id={id} actor={actor} created={created} state={state}>
      <p className='text-sm'>
        {t.rich(messageKey, {
          actor: actor.name,
          assignee: report.assignee.name,
          player: report.player.name,
          b: (chunks) => <span className='font-semibold'>{chunks}</span>
        })}
      </p>
      <div className='flex items-center gap-3'>
        <PlayerAppealBadge appeal={{}} className='text-sm'>#{report.id}</PlayerAppealBadge>
        <blockquote className='px-3 text-ellipsis line-clamp-1 my-4 border-s-2 border-gray-400 text-gray-400'>{report.reason}</blockquote>
      </div>
    </NotificationContainer>
  )
}
