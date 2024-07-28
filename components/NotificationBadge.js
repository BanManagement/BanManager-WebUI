export default function NotificationBadge ({ children, className = '' }) {
  return (
    <div className={`flex-grow flex justify-end ${className}`}>
      <div className='w-6 h-6 text-xs rounded-full text-white bg-red-500 flex items-center justify-center'>
        <span>
          {children}
        </span>
      </div>
    </div>
  )
}
