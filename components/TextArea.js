import { forwardRef, useId } from 'react'
import clsx from 'clsx'
import { MdError } from 'react-icons/md'

// eslint-disable-next-line react/display-name
const TextArea = forwardRef((props, ref) => {
  const {
    id,
    className = '',
    inputClassName = '',
    labelClassName = '',
    placeholder = '',
    label = '',
    error = '',
    required = false,
    onChange = () => {},
    minLength,
    maxLength,
    ...rest
  } = props
  const inputClass = clsx(`
    flex-1
    appearance-none
    w-full
    py-2.5
    px-4
    bg-primary-900
    text-gray-300
    placeholder-gray-400
    text-lg
    rounded-3xl
    focus:outline-none
    peer
    ${inputClassName}`
  )
  const labelClass = clsx(`
    absolute
    text-sm
    text-gray-400
    duration-300
    transform
    -translate-y-3
    translate-x-1.5
    scale-75
    top-2
    left-4
    z-10
    origin-[0]
    start-2.5
    peer-focus:text-gray-500
    peer-placeholder-shown:scale-100
    peer-placeholder-shown:translate-y-0
    peer-focus:scale-75
    rtl:peer-focus:translate-x-1/4
    rtl:peer-focus:left-auto
    ${labelClassName}
  `)
  const containerClassName = clsx(`
    flex
    mb-2
    relative
    rounded-3xl
    focus-within:outline-none
    focus-within:border-transparent
    ${className}`)
  const uniqueId = useId()

  const handleChange = (e) => {
    onChange(e, { ...props, value: e?.target?.value })
  }

  return (
    <div className='mb-6'>
      <div className={containerClassName}>
        <textarea
          ref={ref}
          className={inputClass}
          id={id || uniqueId}
          placeholder={placeholder}
          onChange={handleChange}
          required={required}
          aria-describedby={id || uniqueId}
          minLength={minLength}
          maxLength={maxLength}
          {...rest}
        />
        {label &&
          <label
            htmlFor={id || uniqueId}
            className={labelClass}
          >
            {label}
          </label>}
      </div>
      {error && <p className='text-xs flex items-center gap-2 pl-4 text-red-700'><MdError /> {error}</p>}
    </div>
  )
})

export default TextArea
