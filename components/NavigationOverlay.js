import { createContext } from 'react'
import { Transition } from '@headlessui/react'
import { RemoveScroll } from 'react-remove-scroll'
import clsx from 'clsx'

const NavigationOverlayContext = createContext()

const NavigationOverlay = ({ children, drawerOpen, setDrawerOpen }) => {
  return (
    <NavigationOverlayContext.Provider value={{ drawerOpen, setDrawerOpen }}>
      <Transition
        show={drawerOpen}
        enter='transition-opacity ease-linear duration-300'
        enterFrom='opacity-0'
        enterTo='opacity-100'
        leave='transition-opacity ease-linear duration-300'
        leaveFrom='opacity-100'
        leaveTo='opacity-0'
      >
        <div className='z-10 fixed inset-0 transition-opacity'>
          <div className='absolute inset-0 bg-black opacity-50' tabIndex='0' onClick={() => setDrawerOpen(false)} />
        </div>
      </Transition>
      <RemoveScroll forwardProps enabled={drawerOpen}>
        <aside
          className={clsx('top-0 right-0 w-72 bg-gray-800 fixed h-full overflow-auto ease-in-out transition-all duration-300 z-30', RemoveScroll.classNames.zeroRight,
            {
              'translate-x-0': drawerOpen,
              'translate-x-full': !drawerOpen
            })}
        >
          {children}
        </aside>
      </RemoveScroll>
    </NavigationOverlayContext.Provider>
  )
}

const Header = ({ children }) => {
  return (
    <NavigationOverlayContext.Consumer>
      {({ setDrawerOpen }) => (
        <div className='pt-5 pb-6 px-5'>
          <div className='flex items-center justify-between'>
            <div>
              {children}
            </div>
            <div className='-mr-2'>
              <button type='button' className='rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none' onClick={() => setDrawerOpen(false)}>
                <span className='sr-only'>Close menu</span>
                <svg className='h-6 w-6' xmlns='http:www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </NavigationOverlayContext.Consumer>
  )
}

const Body = ({ children, className = '' }) => {
  return (
    <div className={`px-5 ${className}`}>
      {children}
    </div>
  )
}

NavigationOverlay.Header = Header
NavigationOverlay.Body = Body

export default NavigationOverlay
