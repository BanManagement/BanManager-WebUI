import { forwardRef } from 'react'
import Datetime from '@nateradebaugh/react-datetime'
import clsx from 'clsx'

// eslint-disable-next-line react/display-name
const DateTimePicker = forwardRef(({ className, ...rest }, ref) => {
  const inputClass = clsx(`
    flex-1
    appearance-none
    w-full
    py-2
    px-4
    bg-black
    text-white
    placeholder-gray-400
    shadow-sm
    text-lg
    rounded-sm
    focus:outline-none
    focus:ring-2
    focus:ring-accent-600
    focus:border-transparent
    ${className}`
  )

  return <Datetime ref={ref} dateFormat='dd/MM/yyyy' className={inputClass} {...rest} />
})

export default DateTimePicker
