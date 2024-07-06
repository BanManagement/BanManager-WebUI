import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { mutate } from 'swr'
import Dropdown from './Dropdown'
import Avatar from './Avatar'
import Button from './Button'
import NotificationBadge from './NotificationBadge'
import { MdOutlineNotifications, MdNotifications, MdManageAccounts, MdDashboard, MdOutlineDashboard } from 'react-icons/md'
import { useUser } from '../utils'

const buttonClassName = 'bg-primary-900 !rounded-lg p-2 transform transition duration-300 hover:scale-110 hover:bg-primary-900 w-12 h-12'

export default function SessionNavProfile ({ user, unreadNotificationCount }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const { hasPermission } = useUser()

  const handleLogout = async () => {
    setLoggingOut(true)

    // Using cookies for SSR instead of local storage, which are set to HttpOnly
    // requires server to delete cookie
    const response = await fetch((process.env.BASE_PATH || '') + '/api/logout',
      {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        credentials: 'include'
      })

    if (response.status !== 204) {
      setLoggingOut(false)

      const responseData = await response.json()

      throw new Error(responseData.error)
    }

    mutate('/api/user')
    router.push('/')
  }

  return (
    <>
      <div className='hidden md:flex gap-4'>
        {hasPermission('servers', 'manage') && <Link href='/admin' passHref><Button className={buttonClassName} title='Admin'><MdManageAccounts /></Button></Link>}
        <Link href='/notifications' passHref>
          <Button className={buttonClassName} notificationCount={unreadNotificationCount}>
            {router.pathname.endsWith('/notifications') ? <MdNotifications /> : <MdOutlineNotifications />}
          </Button>
        </Link>
        <Link href='/dashboard' passHref><Button className={buttonClassName} title='Dashboard'>{router.pathname.endsWith('/dashboard') ? <MdDashboard /> : <MdOutlineDashboard /> }</Button></Link>
        <Dropdown
          trigger={({ onClickToggle }) => (
            <Button
              onClick={onClickToggle}
              className={buttonClassName}
              title={user.name}
            >
              <Avatar width='32' height='32' uuid={user.id} />
            </Button>
          )}
        >
          <Dropdown.Item name='Account' href='/account' />
          {!user.hasAccount && <Dropdown.Item name='Register' href='/register' />}
          <Dropdown.Item name='Profile' href={'/player/' + user.id} />
          <div className='border-primary-400 border-b mx-1'></div>
          <Dropdown.Item name='Log out' onClick={handleLogout} disabled={loggingOut} />
        </Dropdown>
      </div>
      <div className='md:hidden flex flex-col sm:flex-row sm:justify-around'>
        <Link href={'/player/' + user.id}>
          <div className='px-2 py-4 text-gray-200 flex flex-row gap-6'>
            <Avatar width='48' height='48' uuid={user.id} />
            <div>
              <div className='text-lg font-normal'>{user.name}</div>
              <div className='text-gray-400 text-sm font-normal'>View profile</div>
            </div>
          </div>
        </Link>
        <span className='text-5xl mb-2 border-b border-primary-400 leading-none' />
        <Dropdown.Item name='Account' href='/account' className='px-2 mb-2 m-0' />
        <Dropdown.Item name='Dashboard' href='/dashboard' className='px-2 mb-2' />
        <Dropdown.Item name='Notifications' href='/notifications' className='px-2 mb-2'>
          {unreadNotificationCount > 0 && <NotificationBadge>{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</NotificationBadge>}
        </Dropdown.Item>
        <Dropdown.Item name='Profile' href={'/player/' + user.id} className='px-2 mb-2' />
        <span className='text-5xl mb-2 border-b border-primary-400 leading-none' />
        <Dropdown.Item name='Log out' onClick={handleLogout} disabled={loggingOut} className='px-2 mb-2' />
        {hasPermission('servers', 'manage') && (
          <>
            <span className='text-5xl mb-2 border-b border-primary-400 leading-none' />
            <Dropdown.Item name='Admin' href='/admin' className='px-2' />
          </>)
        }
      </div>
    </>
  )
}
