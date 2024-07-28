import NotificationContainer from './NotificationContainer'

export default function NotificationAppealCreated ({ id, actor, created, state, appeal }) {
  return (
    <NotificationContainer id={id} actor={actor} created={created} state={state}>
      <p className='text-sm'><span className='font-semibold'>{actor.name}</span> created an appeal</p>
      <blockquote className='px-3 text-ellipsis line-clamp-2 my-4 border-s-2 border-gray-400 text-gray-400'>{appeal?.reason}</blockquote>
    </NotificationContainer>
  )
}
