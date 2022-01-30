import { createContext, forwardRef } from 'react'
import clsx from 'clsx'

const MessageContext = createContext()

// eslint-disable-next-line react/display-name
const Message = forwardRef(({ error, info, success, warning, children, className }, ref) => {
  const classes = clsx('bg-black border-l-4 p-4 mb-4 shadow-lg', {
    'border-red-600': !!error,
    'border-blue-600': !!info,
    'border-green-600': !!success,
    'border-yellow-400': !!warning,
    [className]: !!className
  })

  return (
    <div ref={ref} className={classes} role='alert'>
      <MessageContext.Provider value={{ error, info, success, warning }}>
        {children}
      </MessageContext.Provider>
    </div>
  )
})

const Header = ({ children }) => {
  return (
    <MessageContext.Consumer>
      {({ error, info, success, warning }) => {
        const className = clsx('font-bold', {
          'text-red-500': !!error,
          'text-blue-500': !!info,
          'text-green-500': !!success,
          'text-yellow-400': !!warning
        })

        return (
          <p className={className}>
            {children}
          </p>
        )
      }}
    </MessageContext.Consumer>
  )
}

const List = ({ children }) => {
  return (
    <ul className='list-none'>
      {children}
    </ul>
  )
}

const Item = ({ children }) => {
  return (
    <li className='ml-3 py-2 text-sm font-medium'>
      {children}
    </li>
  )
}

Message.Header = Header
Message.List = List
Message.Item = Item

export default Message
