import { createContext, forwardRef } from 'react'
import clsx from 'clsx'

const MessageContext = createContext()

// eslint-disable-next-line react/display-name
const Message = forwardRef(({ error, info, success, warning, children, className, ...rest }, ref) => {
  const classes = clsx('bg-black border-l-4 p-4 mb-4 shadow-lg', {
    'border-red-800': !!error,
    'border-sky-800': !!info,
    'border-emerald-800': !!success,
    'border-amber-500': !!warning,
    [className]: !!className
  })

  return (
    <div ref={ref} className={classes} role='alert' {...rest}>
      <MessageContext.Provider value={{ error, info, success, warning }}>
        {children}
      </MessageContext.Provider>
    </div>
  )
})

const Header = ({ children, ...rest }) => {
  return (
    <MessageContext.Consumer>
      {({ error, info, success, warning }) => {
        const className = clsx('font-bold', {
          'text-red-700': !!error,
          'text-sky-700': !!info,
          'text-emerald-700': !!success,
          'text-yellow-600': !!warning
        })

        return (
          <p className={className} {...rest}>
            {children}
          </p>
        )
      }}
    </MessageContext.Consumer>
  )
}

const List = ({ children, ...rest }) => {
  return (
    <ul className='list-none' {...rest}>
      {children}
    </ul>
  )
}

const Item = ({ children, ...rest }) => {
  return (
    <li className='ml-3 py-2 text-sm font-medium' {...rest}>
      {children}
    </li>
  )
}

Message.Header = Header
Message.List = List
Message.Item = Item

export default Message
