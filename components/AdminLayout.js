import Head from 'next/head'
import Link from 'next/link'
import { useRouter, withRouter } from 'next/router'
import clsx from 'clsx'
import { BiServer } from 'react-icons/bi'
import { MdOutlineGroups, MdOutlineExitToApp, MdOutlineNotifications, MdLogout, MdSettings } from 'react-icons/md'
import Avatar from './Avatar'
import Loader from './Loader'
import ErrorLayout from './ErrorLayout'
import Nav from './Nav'
import SessionNavProfile from './SessionNavProfile'
import { useApi, useUser } from '../utils'

const icons = {
  Roles: <MdOutlineGroups />,
  Servers: <BiServer />,
  'Notification Rules': <MdOutlineNotifications />
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
                <div className='h-full bg-primary-900 flex flex-col'>
                  <div className='pt-6 ml-8'>
                    <div className='font-bold text-xl flex w-full'>
                      <span className='mx-4'>
                        <Link href='/admin'>Admin</Link>
                      </span>
                      <Link href='/dashboard' passHref className='m-auto flex-grow text-right'>
                        <MdOutlineExitToApp className='inline-flex mx-5 hover:text-accent-200' />
                      </Link>
                    </div>
                  </div>
                  <nav className='mt-6 h-screen flex flex-col justify-between'>
                    <div className='h-full'>
                      {left.map(({ href, name, label }) => {
                        const className = clsx('hover:text-accent-200 flex transition-colors text-gray-100 text-xl p-2 my-4', {
                          'border-l-4 border-accent-500': router.asPath === href
                        })
                        return (
                          (
                            <Link key={`${href}${name}`} href={href} passHref className={className}>

                              {icons[name] && <span className='text-left m-auto'>{icons[name]}</span>}
                              <span className='mx-4 text-base m-auto font-normal'>
                                {name}
                              </span>
                              {label !== null &&
                                <span className='flex-grow text-right mr-3'>
                                  <button type='button' className='w-6 h-6 text-xs rounded-full text-white bg-accent-500'>
                                    <span className='p-1'>
                                      {label}
                                    </span>
                                  </button>
                                </span>}

                            </Link>
                          )
                        )
                      })}
                    </div>
                    <div className='h-1/5 flex flex-col'>
                      <div className='flex-grow'>
                        <div className='flex px-4'>
                          <Link href={`/player/${user.id}`} className='flex'>

                            <Avatar width='36' height='36' uuid={user.id} />
                            <div className='ml-4 text-sm'>
                              <div>{user.name}</div>
                              <div>View Profile</div>
                            </div>

                          </Link>
                        </div>
                      </div>
                      <div className='flex justify-evenly py-3 bg-gray-800'>
                        <Link href='/notifications' title='Notifications'>

                          <MdOutlineNotifications className='w-6 h-6' />

                        </Link>
                        <Link href='/account' title='Settings'>

                          <MdSettings className='w-6 h-6' />

                        </Link>
                        <Link href='/dashboard' title='Return'>

                          <MdLogout className='w-6 h-6' />

                        </Link>
                      </div>
                    </div>
                  </nav>
                </div>
              </div>
              <div className='flex flex-col w-full md:space-y-4'>
                <div className='overflow-auto h-screen pb-24 pt-4 px-4 md:px-6'>
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
