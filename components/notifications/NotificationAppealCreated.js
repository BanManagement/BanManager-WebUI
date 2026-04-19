import { useTranslations } from 'next-intl'
import NotificationContainer from './NotificationContainer'

export default function NotificationAppealCreated ({ id, actor, created, state, appeal }) {
  const t = useTranslations('notifications')

  return (
    <NotificationContainer id={id} actor={actor} created={created} state={state}>
      <p className='text-sm'>{t.rich('appealCreated', { name: actor.name, b: (chunks) => <span className='font-semibold'>{chunks}</span> })}</p>
      <blockquote className='px-3 text-ellipsis line-clamp-2 my-4 border-s-2 border-gray-400 text-gray-400'>{appeal?.reason}</blockquote>
    </NotificationContainer>
  )
}
