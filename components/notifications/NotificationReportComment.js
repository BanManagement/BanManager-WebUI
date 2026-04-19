import { useTranslations } from 'next-intl'
import { useUser } from '../../utils'
import NotificationContainer from './NotificationContainer'

export default function NotificationReportComment ({ id, actor, created, state, report, comment }) {
  const t = useTranslations('notifications')
  const { user } = useUser()
  const ownReport = report.actor.id === user?.id
  const messageKey = ownReport ? 'reportCommentOwn' : 'reportCommentOther'

  return (
    <NotificationContainer id={id} actor={actor} created={created} state={state}>
      <p className='text-sm'>
        {t.rich(messageKey, { name: actor.name, b: (chunks) => <span className='font-semibold'>{chunks}</span> })}
      </p>
      <div className='flex justify-start items-center gap-3'>
        <blockquote className='px-3 text-ellipsis line-clamp-1 my-4 border-s-2 border-gray-400 text-gray-400'>{comment.content}</blockquote>
      </div>
    </NotificationContainer>
  )
}
