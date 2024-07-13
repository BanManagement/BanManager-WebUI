import { useUser } from '../../utils'
import NotificationContainer from './NotificationContainer'

export default function NotificationReportComment ({ id, actor, created, state, report, comment }) {
  const { user } = useUser()

  return (
    <NotificationContainer id={id} actor={actor} created={created} state={state}>
      <p className='text-sm'>
        {report.actor.id === user?.id
          ? <>{actor.name} commented on your report</>
          : <><span className='font-semibold'>{actor.name}</span> added a comment</>}
      </p>
      <div className='flex justify-start items-center gap-3'>
        <blockquote className='px-3 text-ellipsis line-clamp-1 my-4 border-s-2 border-gray-400 text-gray-400'>{comment.content}</blockquote>
      </div>
    </NotificationContainer>
  )
}
