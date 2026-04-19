import { useTranslations } from 'next-intl'
import { useUser } from '../../utils'
import PlayerAppealBadge from '../appeals/PlayerAppealBadge'
import NotificationContainer from './NotificationContainer'

export default function NotificationAppealComment ({ id, actor, created, comment, state, appeal }) {
  const t = useTranslations('notifications')
  const { user } = useUser()
  const ownAppeal = appeal.actor.id === user?.id
  const messageKey = ownAppeal ? 'appealCommentOwn' : 'appealCommentOther'

  return (
    <NotificationContainer id={id} actor={actor} created={created} state={state}>
      <p className='text-sm'>
        {t.rich(messageKey, { name: actor.name, b: (chunks) => <span className='font-semibold'>{chunks}</span> })}
      </p>
      <div className='flex justify-start items-center gap-3'>
        <PlayerAppealBadge appeal={appeal} className='text-sm'>#{appeal.id}</PlayerAppealBadge>
        <blockquote className='px-3 text-ellipsis line-clamp-1 my-4 border-s-2 border-gray-400 text-gray-400'>{comment.content}</blockquote>
      </div>
    </NotificationContainer>
  )
}
