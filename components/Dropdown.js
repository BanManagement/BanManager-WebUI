import { cloneElement, forwardRef, useRef } from 'react'
import clsx from 'clsx'
import Link from 'next/link'
import { useDetectOutsideClick } from '../utils'
import Button from './Button'

const Dropdown = ({ trigger = '', children }) => {
  const dropdownRef = useRef(null)
  const [isActive, setIsActive] = useDetectOutsideClick(dropdownRef, false)
  const onClick = () => setIsActive(!isActive)

  return (
    <div className='relative inline-block text-left'>
      <div>
        <Button
          type='button'
          onClick={onClick}
        >
          {trigger}
        </Button>
      </div>
      <div
        ref={dropdownRef}
        className={clsx('origin-top-right absolute z-50 right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5',
          {
            hidden: !isActive
          })}
      >
        <div
          className='py-1'
          role='menu'
          aria-orientation='vertical'
          aria-labelledby='options-menu'
        >
          {children}
        </div>
      </div>
    </div>
  )
}

const Item = ({ href = '', children, name, onClick, icon, className = '' }) => {
  return (
    <Link href={href} passHref>
      <ItemLink name={name} href={href} onClick={onClick} className={className} icon={icon}>{children}</ItemLink>
    </Link>
  )
}

// eslint-disable-next-line react/display-name
const ItemLink = forwardRef(({ name, onClick, href, className, icon, children }, ref) => {
  return (
    <a href={href} onClick={onClick} ref={ref} className={`flex items-center z-10 px-4 bg-gray-800 py-2 text-md text-gray-100 hover:text-accent-200 hover:bg-gray-600 ${className}`} role='menuitem'>
      {icon && cloneElement(icon, {
        className: 'flex-shrink-0 h-6 w-6 mr-4'
      })}
      <span className='flex flex-col'>
        {name}
      </span>
      {children}
    </a>
  )
})

Dropdown.Item = Item

export default Dropdown
