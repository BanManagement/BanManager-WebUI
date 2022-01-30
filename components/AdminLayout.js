import Head from 'next/head'
import Link from 'next/link'
import { useRouter, withRouter } from 'next/router'
import clsx from 'clsx'
import { BiServer } from 'react-icons/bi'
import { MdOutlineGroups, MdOutlineExitToApp } from 'react-icons/md'
import { AiOutlineLayout } from 'react-icons/ai'
import Loader from './Loader'
import ErrorLayout from './ErrorLayout'
import Nav from './Nav'
import SessionNavProfile from './SessionNavProfile'
import { useApi, useUser } from '../utils'

const icons = {
  'Page Layouts': <AiOutlineLayout />,
  Roles: <MdOutlineGroups />,
  Servers: <BiServer />
}

const AdminLayout = ({ children, title }) => {
  const router = useRouter()
  const { user } = useUser({ redirectIfFound: false, redirectTo: '/login' })
  const { loading, data, errors } = useApi({
    query: `query navigation {
      adminNavigation {
        left {
          id
          name
          href
          label
        }
      }
      navigation {
        left {
          id
          name
          href
        }
      }
    }`
  })

  if ((loading && !data) || !user) return <Loader />
  if (errors || !data) return <ErrorLayout errors={errors} />

  const right = [<SessionNavProfile key='session-nav-profile' user={user} />]
  const left = data.adminNavigation.left
  const mobileItems = left.slice()

  mobileItems[mobileItems.length - 1].splitBorder = true

  mobileItems.push(...data.navigation.left)

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className='flex flex-col h-screen font-primary bg-primary-500'>
        <div className='md:hidden'><Nav leftItems={data.navigation.left} mobileItems={mobileItems} rightItems={right} /></div>
        <div className='flex-grow text-white bg-primary-500'>
          <main className='h-screen overflow-hidden relative'>
            <div className='flex items-start justify-between'>
              <div className='h-screen hidden lg:block shadow-lg relative w-80'>
                <div className='h-full bg-primary-900'>
                  <div className='pt-6 ml-8'>
                    <div className='font-bold text-xl flex w-full'>
                      <span className='mx-4'>
                        <Link href='/admin'>Admin</Link>
                      </span>
                      <Link href='/dashboard' passHref>
                        <a className='m-auto flex-grow text-right'><MdOutlineExitToApp className='inline-flex mx-5 hover:text-accent-200' /></a>
                      </Link>
                    </div>
                  </div>
                  <nav className='mt-6'>
                    <div>
                      {left.map(({ href, name, label }) => {
                        const className = clsx('hover:text-accent-200 flex transition-colors text-gray-100 text-xl p-2 my-4', {
                          'border-l-4 border-accent-500': router.asPath === href
                        })
                        return (
                          <Link key={`${href}${name}`} href={href} passHref>
                            <a className={className}>
                              {icons[name] && <span className='text-left m-auto'>{icons[name]}</span>}
                              <span className='mx-4 text-base m-auto font-normal'>
                                {name}
                              </span>
                              {label &&
                                <span className='flex-grow text-right mr-3'>
                                  <button type='button' className='w-6 h-6 text-xs rounded-full text-white bg-accent-500'>
                                    <span className='p-1'>
                                      {label}
                                    </span>
                                  </button>
                                </span>}
                            </a>
                          </Link>
                        )
                      })}
                    </div>
                  </nav>
                </div>
              </div>
              <div className='flex flex-col w-full md:space-y-4'>
                <header className='w-full h-16 z-40 hidden md:flex items-center justify-between'>
                  <div className='relative z-20 flex flex-col justify-end h-full px-3 md:w-full'>
                    <div className='relative p-1 flex items-center w-full space-x-4 justify-end top-4'>
                      <SessionNavProfile key='session-nav-profile' user={user} />
                    </div>
                  </div>
                </header>
                <div className='overflow-auto h-screen pb-24 px-4 md:px-6'>
                  {children}
                </div>
              </div>
            </div>
          </main>

        </div>
      </div>
    </>
  )
}

export default withRouter(AdminLayout)
