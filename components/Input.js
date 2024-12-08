import { forwardRef, useId } from 'react'
import clsx from 'clsx'
import { MdError, MdOutlineInfo } from 'react-icons/md'
import { useToggle } from '../utils'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

// eslint-disable-next-line react/display-name
const Input = forwardRef((props, ref) => {
  const {
    id,
    className = '',
    inputClassName = '',
    labelClassName = '',
    placeholder = '',
    label = '',
    type = 'text',
    error = '',
    required = false,
    icon = null,
    iconPosition = 'left',
    description = '',
    disabled = false,
    onChange = () => {},
    ...rest
  } = props
  const uniqueId = useId()
  const [showInput, toggleShowInput] = useToggle(!(type === 'password'))

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

  const labelClass = clsx(`
    absolute
    text-sm
    text-gray-400
    duration-300
    transform
    -translate-y-3
    scale-75
    top-1/4
    z-10
    origin-[0]
    start-2.5
    peer-focus:text-gray-500
    peer-placeholder-shown:scale-100
    peer-placeholder-shown:translate-y-0
    peer-focus:scale-75
    peer-focus:-translate-y-3
    rtl:peer-focus:translate-x-1/4
    rtl:peer-focus:left-auto
    ${labelClassName}
  `,
  {
    'ml-8': icon && iconPosition === 'left'
  })
  const containerClassName = clsx(`
    flex
    mb-2
    relative
    rounded-3xl
    focus-within:outline-none
    focus-within:border-transparent
    ${className}`,
  {
    'ring-red-700 ring-2': error,
    'focus-within:ring-2 focus-within:ring-accent-600': !error,
    'border-opacity-0 opacity-50 cursor-not-allowed': disabled
  })

  const handleChange = (e) => {
    onChange(e, { ...props, value: e?.target?.value })
  }

  return (
    <div className='mb-6'>
      <div className={containerClassName}>
        {icon && iconPosition === 'left' &&
          <span className='rounded-l-3xl inline-flex items-center px-3 bg-primary-900 text-gray-400 text-lg'>
            {icon}
          </span>}
        <input
          ref={ref}
          type={type === 'password' && showInput ? 'text' : type}
          className={inputClass}
          id={id || uniqueId}
          placeholder={placeholder}
          onChange={handleChange}
          required={required}
          aria-describedby={id || uniqueId}
          disabled={disabled}
          {...rest}
        />
        {type === 'password' &&
          <span className='absolute right-5 top-4 text-gray-400 text-lg cursor-pointer' onClick={toggleShowInput}>
            {showInput ? <FaEye /> : <FaEyeSlash />}
          </span>}
        {label &&
          <label
            htmlFor={id || uniqueId}
            className={labelClass}
          >
            {label}
          </label>}
      </div>
      {error && <p data-cy='errors' className='text-xs flex items-center gap-2 pl-4 text-red-700'><MdError /> {error}</p>}
      {description && <p className='text-xs flex items-center gap-2 pl-4 text-gray-400'><MdOutlineInfo /> {description}</p>}
    </div>
  )
})

export default Input
