import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Fragment, useEffect, useState, isValidElement } from 'react'
import { FaBars } from 'react-icons/fa'
import PageContainer from './PageContainer'
import PlayerSelector from './admin/PlayerSelector'
import NavigationOverlay from './NavigationOverlay'

export default function Nav ({ leftItems, mobileItems, rightItems }) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

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
          className={`text-lg text-white ${router.asPath === item.href ? 'font-bold' : 'hover:text-primary-100'}`}
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
    <div className='relative bg-primary-500'>
      <PageContainer>
        <div className='flex justify-between items-center my-6 pb-6 md:justify-start md:space-x-10'>
          <div className='flex justify-start lg:w-0 lg:flex-1'>
            <Link href='/' passHref>

              <span className='sr-only'>Home</span>
              <Image src={process.env.BASE_PATH + '/images/banmanager-icon.png'} alt='Logo' width='40' height='40' />

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
      <NavigationOverlay drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
        <NavigationOverlay.Header>
          <Link href='/' passHref key='logo-icon'>

            <span className='sr-only'>Home</span>
            <Image width='40' height='40' src={process.env.BASE_PATH + '/images/banmanager-icon.png'} alt='Logo' />

          </Link>
        </NavigationOverlay.Header>
        <NavigationOverlay.Body className='!px-2 flex flex-col sm:flex-row sm:justify-around'>
          <nav>
            {renderMenu(rightItems)}
            {mobileItems.map(({ href, name, icon, label, splitBorder }) => (
              <Fragment key={`${href}${name}`}>
                <Link
                  href={href}
                  passHref
                  className='hover:text-accent-200 hover:bg-gray-600 flex transition-colors text-gray-100 text-xl p-2 my-4 rounded-lg'
                >

                  {icon}
                  <span className='mx-4 text-lg font-normal'>
                    {name}
                  </span>
                  {!!label &&
                    <span className='flex-grow text-right'>
                      <button type='button' className='w-6 h-6 text-xs rounded-full text-white bg-accent-500'>
                        <span className='p-1'>
                          {label}
                        </span>
                      </button>
                    </span>}

                </Link>
                {splitBorder && <span className='text-5xl pb-4 mb-4 border-b border-accent-200 leading-none' />}
              </Fragment>
            ))}
          </nav>
        </NavigationOverlay.Body>
      </NavigationOverlay>
    </div>
  )
}
