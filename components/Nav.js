import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Fragment, useEffect, useState, isValidElement } from 'react'
import clsx from 'clsx'
import { Transition } from '@headlessui/react'
import { RemoveScroll } from 'react-remove-scroll'
import { FaBars } from 'react-icons/fa'
import PageContainer from './PageContainer'
import PlayerSelector from './admin/PlayerSelector'

export default function Nav ({ leftItems, mobileItems, rightItems }) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const renderMenu = (items = []) => items.map(item => {
    if (isValidElement(item)) {
      return item
    }

    return (
      <Link key={item.name} href={item.href} passHref>
        <a href={item.href} key={item.name} className={`text-lg text-white ${router.asPath === item.href ? 'font-bold' : 'hover:text-primary-100'}`}>
          {item.name}
        </a>
      </Link>
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
    <div className='relative bg-primary-500'>
      <PageContainer>
        <div className='flex justify-between items-center my-6 pb-6 md:justify-start md:space-x-10'>
          <div className='flex justify-start lg:w-0 lg:flex-1'>
            <Link href='/' passHref>
              <a>
                <span className='sr-only'>Home</span>
                <Image src='/images/banmanager-icon.png' alt='Logo' width='40' height='40' />
              </a>
            </Link>
            <div className='mx-8 w-48'>
              <PlayerSelector
                multiple={false}
                onChange={(id) => id ? router.push(`/player/${id}`) : undefined}
                placeholder='Search player'
              />
            </div>
          </div>
          <div className='-mr-2 -my-2 md:hidden'>
            <button type='button' className='rounded-md p-2 inline-flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 text-2xl' onClick={() => setDrawerOpen(true)}>
              <span className='sr-only'>Open menu</span>
              <FaBars />
            </button>
          </div>
          <nav className='hidden md:flex space-x-10'>
            {renderMenu(leftItems)}
          </nav>
          <div className='hidden md:flex items-center justify-end md:flex-1 lg:w-0'>
            {renderMenu(rightItems)}
          </div>
        </div>
      </PageContainer>
      <Transition
        show={drawerOpen}
        enter='duration-200 ease-out'
        enterFrom='opacity-0 scale-95'
        enterTo='opacity-100 scale-100'
        leave='duration-100 ease-in'
        leaveFrom='opacity-100 scale-100'
        leaveTo='opacity-0 scale-95'
      >
        {(ref) => (
          <div ref={ref} className='z-10 fixed inset-0 transition-opacity'>
            <div className='absolute inset-0 bg-black opacity-50' tabIndex='0' onClick={() => setDrawerOpen(false)} />
          </div>
        )}
      </Transition>
      <RemoveScroll forwardProps enabled={drawerOpen}>
        <aside
          className={clsx('top-0 right-0 w-72 bg-gray-800 fixed h-full overflow-auto ease-in-out transition-all duration-300 z-30', RemoveScroll.classNames.zeroRight,
            {
              'translate-x-0': drawerOpen,
              'translate-x-full': !drawerOpen
            })}
        >
          <div className='pt-5 pb-6 px-5'>
            <div className='flex items-center justify-between'>
              <div>
                <Link href='/' passHref key='logo-icon'>
                  <a>
                    <span className='sr-only'>Home</span>
                    <Image width='40' height='40' src='/images/banmanager-icon.png' alt='Logo' />
                  </a>
                </Link>
              </div>
              <div className='-mr-2'>
                <button type='button' className='rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-grey-500' onClick={() => setDrawerOpen(false)}>
                  <span className='sr-only'>Close menu</span>
                  <svg className='h-6 w-6' xmlns='http:www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className='px-2 flex flex-col sm:flex-row sm:justify-around'>
            <nav>
              {renderMenu(rightItems)}
              {mobileItems.map(({ href, name, icon, label, splitBorder }) => (
                <Fragment key={`${href}${name}`}>
                  <Link href={href} passHref>
                    <a className='hover:text-accent-200 hover:bg-gray-600 flex transition-colors text-gray-100 text-xl p-2 my-4 rounded-lg'>
                      {icon}
                      <span className='mx-4 text-lg font-normal'>
                        {name}
                      </span>
                      {label &&
                        <span className='flex-grow text-right'>
                          <button type='button' className='w-6 h-6 text-xs rounded-full text-white bg-accent-500'>
                            <span className='p-1'>
                              {label}
                            </span>
                          </button>
                        </span>}
                    </a>
                  </Link>
                  {splitBorder && <span className='text-5xl pb-4 mb-4 border-b border-accent-200 leading-none' />}
                </Fragment>
              ))}
            </nav>
          </div>
        </aside>
      </RemoveScroll>
    </div>
  )
}
