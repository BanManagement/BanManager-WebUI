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
    ${inputClassName}`
  )

  const handleChange = (e) => {
    onChange(e, { ...props, value: e?.target?.value })
  }

  return (
    <div className={`flex relative mb-6 ${className}`}>
      {label &&
        <label
          htmlFor={id}
          className='text-xs text-white font-light placeholder-gray-gray4 px-2 pt-1.5'
        >
          {label} {required && <span className='text-red'>*</span>}
        </label>}
      {icon && iconPosition === 'left' &&
        <span className='inline-flex items-center px-3 bg-black text-gray-500 shadow-sm text-lg'>
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
