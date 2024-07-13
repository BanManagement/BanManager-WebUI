import clsx from 'clsx'
import { forwardRef } from 'react'

// eslint-disable-next-line react/display-name
const Button = forwardRef(({ children, disabled, loading, className = '', notificationCount = 0, ...rest }, ref) => {
  return (
    <button ref={ref} className={`btn bg-accent-700 hover:opacity-80 ${className}`} disabled={disabled} {...rest}>
      <span className={clsx('loader h-5 w-5', { 'inline-block': loading })} />
      <span className={clsx('flex items-center', { invisible: loading })}>
        {children}
      </span>
      {notificationCount > 0 && (
        <span className='absolute bg-red-500 text-red-100 px-2 py-1 text-xs font-bold rounded-full -top-3 -right-3'>
          {notificationCount}
        </span>
      )}
    </button>
  )
})

export default Button
