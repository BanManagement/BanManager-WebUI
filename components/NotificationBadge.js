export default function NotificationBadge ({ children }) {
  return (
    <span className='flex-grow text-right pl-3'>
      <div className='w-6 h-6 text-xs rounded-full text-white bg-red-500 inline-block text-center'>
        <span className='p-1 inline-block'>
          {children}
        </span>
      </div>
    </span>
  )
}
