import { cloneElement, createContext, forwardRef, useRef } from 'react'
import clsx from 'clsx'
import Link from 'next/link'
import { useDetectOutsideClick } from '../utils'

const DropdownContext = createContext({ isActive: false, setIsActive: () => {} })

const Dropdown = ({ trigger = () => {}, children }) => {
  const dropdownRef = useRef(null)
  const [isActive, setIsActive] = useDetectOutsideClick(dropdownRef, false)
  const onClickToggle = () => setIsActive(prevActive => !prevActive)

  return (
    <div className='relative inline-block'>
      <div ref={dropdownRef}>
        {trigger({ onClickToggle })}
      </div>
      <div
        className={clsx('origin-top-right absolute z-50 right-0 mt-1 w-56 rounded-md shadow-black shadow-lg bg-primary-900',
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
          <DropdownContext.Provider value={{ isActive, setIsActive }}>
            {children}
          </DropdownContext.Provider>
        </div>
      </div>
    </div>
  )
}

const Item = ({ href = '', children, name, onClick, icon, className = '' }) => {
  if (href) {
    return (
      <Link href={href} passHref legacyBehavior>
        <ItemLink name={name} href={href} onClick={onClick} className={className} icon={icon}>{children}</ItemLink>
      </Link>
    )
  } else {
    return <ItemLink name={name} onClick={onClick} className={className} icon={icon}>{children}</ItemLink>
  }
}

// eslint-disable-next-line react/display-name
const ItemLink = forwardRef(({ name, onClick, href, className, icon, children }, ref) => {
  return (
    <DropdownContext.Consumer>
      {({ setIsActive }) => (
        <a
          href={href}
          onClick={(...args) => {
            setIsActive(false)

            onClick(...args)
          }}
          ref={ref}
          className={`flex cursor-pointer items-center z-10 p-4 bg-primary-900 py-2 mx-1 text-md text-gray-200 hover:bg-primary-400 ${className}`}
          role='menuitem'
        >
          {icon && cloneElement(icon, {
            className: 'flex-shrink-0 h-6 w-6 mr-4'
          })}
          <span className='flex flex-col'>
            {name}
          </span>
          {children}
        </a>
      )}
    </DropdownContext.Consumer>
  )
})

Dropdown.Item = Item

export default Dropdown
