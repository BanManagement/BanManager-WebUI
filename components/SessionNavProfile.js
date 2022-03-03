import { useState } from 'react'
import { useRouter } from 'next/router'
import { mutate } from 'swr'
import Dropdown from './Dropdown'
import Avatar from './Avatar'
import { CgProfile } from 'react-icons/cg'
import { FaPencilAlt } from 'react-icons/fa'
import { MdLogout, MdSettings } from 'react-icons/md'

export default function SessionNavProfile ({ user }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
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
      <div className='hidden md:block'>
        <Dropdown
          trigger={(
            <>
              <Avatar width='36' height='36' uuid={user.id} />
              <span className='hidden md:inline-block ml-4'>
                {user.name}
              </span>
            </>
          )}
        >
          <Dropdown.Item name='Profile' href={'/player/' + user.id} icon={<CgProfile />} />
          {!user.hasAccount && <Dropdown.Item name='Register' href={'/register'} icon={<FaPencilAlt />} />}
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
        <Dropdown.Item name='Profile' href={'/player/' + user.id} icon={<CgProfile />} />
        <Dropdown.Item name='Settings' href='/account' icon={<MdSettings />} />
        <Dropdown.Item name='Logout' onClick={handleLogout} disabled={loggingOut} icon={<MdLogout />} />
        <span className='text-5xl pb-4 mb-4 border-b border-accent-200 leading-none' />
      </div>
    </>
  )
}
