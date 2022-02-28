import { forwardRef } from 'react'
import clsx from 'clsx'

// eslint-disable-next-line react/display-name
const Checkbox = forwardRef((props, ref) => {
  const {
    id,
    className = '',
    placeholder = '',
    label = '',
    onChange = () => {},
    ...rest
  } = props
  const inputClass = clsx(`
    form-tick
    appearance-none
    bg-black
    bg-check
    h-6
    w-6
    border
    border-gray-500
    rounded-md
    checked:bg-accent-500
    checked:border-transparent
    focus:outline-none`
  )

  const handleChange = (e) => {
    onChange(e, { ...props, name: e?.target?.name, value: e?.target?.value, checked: e?.target?.checked })
  }

  return (
    <div className={`flex relative mb-6 ${className}`}>
      <label className='flex items-center space-x-3 mb-3' htmlFor={id}>
        <input
          ref={ref}
          type='checkbox'
          className={inputClass}
          id={id}
          placeholder={placeholder}
          onChange={handleChange}
          {...rest}
        />
        {label &&
          <span className='text-white font-light placeholder-gray-gray4 px-2'>
            {label}
          </span>}
      </label>
    </div>
  )
})

export default Checkbox
