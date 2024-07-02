import { forwardRef } from 'react'
import clsx from 'clsx'

// eslint-disable-next-line react/display-name
const Input = forwardRef((props, ref) => {
  const {
    id,
    className = '',
    inputClassName = '',
    placeholder = '',
    label = '',
    type = 'text',
    error = '',
    required = false,
    icon = null,
    iconPosition = 'left',
    onChange = () => {},
    ...rest
  } = props
  const inputClass = clsx(`
    flex-1
    appearance-none
    w-full
    py-2
    px-4
    bg-primary-900
    text-gray-300
    placeholder-gray-400
    shadow-sm
    text-lg
    rounded-r-3xl
    focus:outline-none
    ${inputClassName}`,
  {
    'rounded-r-3xl': icon && iconPosition === 'left',
    'rounded-l-3xl': icon && iconPosition === 'right',
    'rounded-3xl': !icon
  }
  )

  const handleChange = (e) => {
    onChange(e, { ...props, value: e?.target?.value })
  }

  return (
    <div className={`flex relative mb-6 ${className} focus-within:outline-none focus-within:rounded-3xl focus-within:ring-2 focus-within:ring-accent-600 focus-within:border-transparent`}>
      {label &&
        <label
          htmlFor={id}
          className='text-xs text-white font-light placeholder-gray-gray4 px-2 pt-1.5'
        >
          {label} {required && <span className='text-red'>*</span>}
        </label>}
      {icon && iconPosition === 'left' &&
        <span className='rounded-l-3xl inline-flex items-center px-3 bg-primary-900 text-gray-500 shadow-sm text-lg'>
          {icon}
        </span>}
      <input
        ref={ref}
        type={type}
        className={inputClass}
        id={id}
        placeholder={placeholder}
        onChange={handleChange}
        required={required}
        {...rest}
      />
      {error && <p className='text-xs pl-2 text-red mb-4'>{error}</p>}
    </div>
  )
})

export default Input
