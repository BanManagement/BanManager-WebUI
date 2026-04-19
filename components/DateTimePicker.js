import { forwardRef } from 'react'
import Datetime from '@nateradebaugh/react-datetime'
import { useLocale } from 'next-intl'
import clsx from 'clsx'
import { LOCALE_CONFIG, DEFAULT_LOCALE } from '../utils/locale'
import { useDateFnsLocale } from '../utils/format-distance'

// eslint-disable-next-line react/display-name
const DateTimePicker = forwardRef(({ className = '', inputClassName = '', error = false, disabled = false, icon = null, iconPosition = 'left', dateFormat, ...rest }, ref) => {
  const locale = useLocale()
  const dateFnsLocale = useDateFnsLocale()
  const localeConfig = LOCALE_CONFIG[locale] || LOCALE_CONFIG[DEFAULT_LOCALE]
  const resolvedDateFormat = dateFormat || localeConfig.dateFormat
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
    'rounded-3xl': !icon,
    'px-4': !icon
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
      <Datetime ref={ref} dateFormat={resolvedDateFormat} locale={dateFnsLocale || undefined} className={inputClass} {...rest} />
    </div>
  )
})

export default DateTimePicker
