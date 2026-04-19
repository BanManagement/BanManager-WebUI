import { useTranslations } from 'next-intl'
import { useUser } from '../../utils'
import PlayerAppealBadge from '../appeals/PlayerAppealBadge'
import NotificationContainer from './NotificationContainer'

const localiseStateName = (t, name) => {
  if (!name) return ''

  const key = name === 'Open' ? 'open' : name.toLowerCase()

  return t.has(`stateLabels.${key}`) ? t(`stateLabels.${key}`) : key
}

export default function NotificationAppealState ({ id, actor, created, state, appeal }) {
  const t = useTranslations('notifications')
  const { user } = useUser()
  const ownAppeal = appeal.actor.id === user?.id
  const messageKey = ownAppeal ? 'appealStateOwn' : 'appealStateOther'
  const localisedState = localiseStateName(t, appeal.state.name)

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
        <PlayerAppealBadge appeal={appeal} className='text-sm'>#{appeal.id}</PlayerAppealBadge>
        <blockquote className='px-3 text-ellipsis line-clamp-1 my-4 border-s-2 border-gray-400 text-gray-400'>{appeal.reason}</blockquote>
      </div>
    </NotificationContainer>
  )
}
