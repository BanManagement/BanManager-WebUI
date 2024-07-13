import { Switch as HeadlessSwitch } from '@headlessui/react'
import clsx from 'clsx'
import { forwardRef, useId } from 'react'
import { MdOutlineInfo } from 'react-icons/md'

// eslint-disable-next-line react/display-name
const Switch = forwardRef((props, ref) => {
  const { id, className = '', label = '', description = '' } = props
  const uniqueId = useId()
  const containerClassName = clsx(`
    flex
    mb-2
    relative
    items-center
    justify-between
    ${className}`)
  const labelClass = clsx(`
    text-gray-200
    pl-4
    text-lg
  `)

  return (
    <div className='mb-6'>
      <div className={containerClassName}>
        {label &&
          <label
            htmlFor={id || uniqueId}
            className={labelClass}
          >
            {label}
          </label>}
        <HeadlessSwitch
          id={id || uniqueId}
          ref={ref}
          className='group inline-flex h-6 w-11 items-center rounded-full bg-primary-900 data-[checked]:bg-accent-700 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'
          {...props}
        >
          <span className='size-4 translate-x-1 rounded-full bg-gray-200 transition group-data-[checked]:translate-x-6' />
        </HeadlessSwitch>
      </div>
      {description && <p className='text-xs flex items-center gap-2 pl-4 text-gray-400'><MdOutlineInfo /> {description}</p>}
    </div>
  )
})

export default Switch
