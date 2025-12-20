import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Fragment, useEffect, isValidElement } from 'react'
import { FaBars } from 'react-icons/fa'
import PageContainer from './PageContainer'
import NavigationOverlay from './NavigationOverlay'
import { useHashRouteToggle } from '../utils'

export default function Nav ({ leftItems, mobileItems, rightItems, unreadNotificationCount }) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useHashRouteToggle('#nav')

  const renderMenu = (items = []) => items.map(item => {
    if (isValidElement(item)) {
      return item
    }

    return (
      (
        <Link
          key={item.name}
          href={item.href}
          passHref
          className={`text-lg text-gray-200 transition-colors duration-200 ${router.asPath === item.href ? 'font-bold text-accent-500' : 'hover:text-accent-400'}`}
        >

          {item.name}

        </Link>
      )
    )
  })

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        setDrawerOpen(false)
      }
    }

    window.addEventListener('keydown', handleEsc)

    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [])

  return (
    <header className='relative bg-primary-500'>
      <PageContainer>
        <nav className='flex justify-between items-center py-5 md:justify-start md:space-x-10'>
          <div className='flex justify-start lg:w-0 lg:flex-1'>
            <Link href='/' passHref className='transition-opacity hover:opacity-80'>
              <span className='sr-only'>Home</span>
              <Image src={(process.env.BASE_PATH || '') + '/images/banmanager-icon.png'} alt='Logo' width='40' height='40' priority />
            </Link>
          </div>
          <div className='flex items-center justify-center flex-1 lg:w-0'>
            {renderMenu(leftItems)}
          </div>
          <div className='md:hidden'>
            <button
              type='button'
              className='rounded-xl w-11 h-11 p-2.5 relative inline-flex items-center justify-center text-gray-200 bg-primary-700 border border-primary-800 hover:bg-primary-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50'
              onClick={() => setDrawerOpen(true)}
              aria-label='Open menu'
            >
              <FaBars className='w-5 h-5' />
              {unreadNotificationCount > 0 && (
                <span className='absolute bg-error text-white px-1.5 py-0.5 text-xs font-bold rounded-full -top-1 -right-1 min-w-[18px] text-center'>
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>
          </div>
          <div className='hidden md:flex items-center justify-end md:flex-1 lg:w-0'>
            {renderMenu(rightItems)}
          </div>
        </nav>
      </PageContainer>
      <NavigationOverlay drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
        <NavigationOverlay.Body className='!px-4 flex flex-col sm:flex-row sm:justify-around'>
          <nav className='space-y-2'>
            {renderMenu(rightItems)}
            {mobileItems?.map(({ href, name, icon, label, splitBorder }) => (
              <Fragment key={`${href}${name}`}>
                <Link
                  href={href}
                  passHref
                  className='flex items-center transition-colors text-gray-200 hover:text-accent-400 hover:bg-primary-700 text-lg p-3 rounded-xl'
                >

                  {icon}
                  <span className='mx-4 font-normal'>
                    {name}
                  </span>
                  {!!label &&
                    <span className='flex-grow text-right'>
                      <span className='inline-flex items-center justify-center w-6 h-6 text-xs rounded-full text-white bg-accent-500 font-medium'>
                        {label}
                      </span>
                    </span>}

                </Link>
                {splitBorder && <span className='block pb-4 mb-4 border-b border-primary-800' />}
              </Fragment>
            ))}
          </nav>
        </NavigationOverlay.Body>
      </NavigationOverlay>
    </header>
  )
}
