import { useTranslations } from 'next-intl'
import NotificationContainer from './NotificationContainer'
import PlayerAppealBadge from '../appeals/PlayerAppealBadge'
import { useUser } from '../../utils'

const localiseStateName = (t, name) => {
  if (!name) return ''

  const key = name === 'Open' ? 'open' : name.toLowerCase()

  return t.has(`stateLabels.${key}`) ? t(`stateLabels.${key}`) : key
}

export default function NotificationReportState ({ id, actor, created, state, report }) {
  const t = useTranslations('notifications')
  const { user } = useUser()
  const ownReport = report.actor.id === user?.id
  const messageKey = ownReport ? 'reportStateOwn' : 'reportStateOther'
  const localisedState = localiseStateName(t, report.state.name)

  return (
    <NotificationContainer id={id} actor={actor} created={created} state={state}>
      <p className='text-sm'>
        {t.rich(messageKey, {
          actor: actor.name,
          state: localisedState,
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
