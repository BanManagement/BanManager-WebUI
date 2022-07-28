import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { mutate } from 'swr'
import Favicon from 'react-favicon'
import Dropdown from './Dropdown'
import Avatar from './Avatar'
import NotificationBadge from './NotificationBadge'
import { CgProfile } from 'react-icons/cg'
import { FaPencilAlt } from 'react-icons/fa'
import { MdOutlineNotifications, MdLogout, MdSettings } from 'react-icons/md'
import { useApi } from '../utils'

const query = `query unreadNotificationCount {
  unreadNotificationCount
}`

export default function SessionNavProfile ({ user }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const { data } = useApi({ query }, { refreshInterval: 10000, refreshWhenHidden: true })

  useEffect(() => {
    if (data) {
      const title = document.title

      if (/\([\d]+\)/.test(title)) {
        const titleStart = title.indexOf(')') + 1

        if (data.unreadNotificationCount === 0) {
          document.title = title.substring(titleStart)
        } else {
          const currentCount = parseInt(title.substring(1, title.indexOf(')')), 10)

          if (data.unreadNotificationCount !== currentCount) {
            document.title = `(${data.unreadNotificationCount}) ${title.substring(titleStart)}`
          }
        }
      } else if (data.unreadNotificationCount !== 0) {
        document.title = `(${data.unreadNotificationCount}) ${title}`
      }
    }
  }, [data])

  const handleLogout = async () => {
    setLoggingOut(true)

    // Using cookies for SSR instead of local storage, which are set to HttpOnly
    // requires server to delete cookie
    const response = await fetch('/api/logout',
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
      <Favicon
        url='/images/favicon-32x32.png'
        faviconSize={32}
        alertCount={data?.unreadNotificationCount || null}
        animated={false}
      />
      <div className='hidden md:block'>
        <Dropdown
          trigger={(
            <>
              <Avatar width='36' height='36' uuid={user.id} />
              <span className='hidden md:inline-block ml-4'>
                {user.name}
              </span>
              {data?.unreadNotificationCount > 0 && <NotificationBadge>{data.unreadNotificationCount}</NotificationBadge>}
            </>
          )}
        >
          <Dropdown.Item name='Notifications' href='/notifications' icon={<MdOutlineNotifications />}>
            {data?.unreadNotificationCount > 0 && <NotificationBadge>{data.unreadNotificationCount}</NotificationBadge>}
          </Dropdown.Item>
          <Dropdown.Item name='Profile' href={'/player/' + user.id} icon={<CgProfile />} />
          {!user.hasAccount && <Dropdown.Item name='Register' href='/register' icon={<FaPencilAlt />} />}
          <Dropdown.Item name='Settings' href='/account' icon={<MdSettings />} />
          <Dropdown.Item name='Logout' onClick={handleLogout} disabled={loggingOut} icon={<MdLogout />} />
        </Dropdown>
      </div>
      <div className='md:hidden flex flex-col sm:flex-row sm:justify-around'>
        <div className='text-gray-100 grid items-center text-center mb-3'>
          <div className='grid-flow-row'>
            <Avatar width='64' height='64' uuid={user.id} />
          </div>
          <span className='grid-flow-row mx-4 text-lg font-normal'>{user.name}</span>
        </div>
        <Dropdown.Item name='Notifications' href='/notifications' icon={<MdOutlineNotifications />}>
          {data?.unreadNotificationCount > 0 && <NotificationBadge>{data.unreadNotificationCount}</NotificationBadge>}
        </Dropdown.Item>
        <Dropdown.Item name='Profile' href={'/player/' + user.id} icon={<CgProfile />} />
        <Dropdown.Item name='Settings' href='/account' icon={<MdSettings />} />
        <Dropdown.Item name='Logout' onClick={handleLogout} disabled={loggingOut} icon={<MdLogout />} />
        <span className='text-5xl pb-4 mb-4 border-b border-accent-200 leading-none' />
      </div>
    </>
  )
}
