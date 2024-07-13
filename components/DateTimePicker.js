import { forwardRef } from 'react'
import Datetime from '@nateradebaugh/react-datetime'
import clsx from 'clsx'

// eslint-disable-next-line react/display-name
const DateTimePicker = forwardRef(({ className = '', inputClassName = '', error = false, disabled = false, icon = null, iconPosition = 'left', ...rest }, ref) => {
  const inputClass = clsx(`
    flex-1
    appearance-none
    w-full
    py-2.5
    pr-4
    bg-primary-900
    text-gray-300
    placeholder-gray-400
    text-lg
    rounded-r-3xl
    focus:outline-none
    peer
    ${inputClassName}`,
  {
    'rounded-r-3xl': icon && iconPosition === 'left',
    'rounded-l-3xl': icon && iconPosition === 'right',
    'rounded-3xl': !icon
  }
  )

  const containerClassName = clsx(`
    flex
    relative
    rounded-3xl
    focus-within:outline-none
    focus-within:border-transparent
    mb-6
    ${className}`,
  {
    'ring-red-700 ring-2': error,
    'focus-within:ring-2 focus-within:ring-accent-600': !error,
    'border-opacity-0 opacity-50 cursor-not-allowed': disabled
  })

  return (
    <div className={containerClassName}>
      {icon && iconPosition === 'left' &&
        <span className='rounded-l-3xl inline-flex items-center px-3 bg-primary-900 text-gray-400 text-lg'>
          {icon}
        </span>}
      <Datetime ref={ref} dateFormat='dd/MM/yyyy' className={inputClass} {...rest} />
    </div>
  )
})

export default DateTimePicker
