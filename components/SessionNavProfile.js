import { useState } from 'react';
import { useRouter } from 'next/router'
import { Dropdown, Image, Menu } from 'semantic-ui-react'
import { mutate } from 'swr'
import MenuLink from './MenuLink'

export default function SessionNavProfile ({ user }) {
  const router = useRouter()
  const [state, setState] = useState({ loggingOut: false })
  const handleLogout = async () => {
    setState({ loggingOut: true })

    // Using cookies for SSR instead of local storage, which are set to HttpOnly
    // requires server to delete cookie
    const response = await fetch('/api/logout',
      {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        credentials: 'include'
      })

    if (response.status !== 204) {
      setState({ loggingOut: false })

      const responseData = await response.json()

      throw new Error(responseData.error)
    }

    mutate('/api/user')
    router.replace('/')
  }

  return (
    <Dropdown
      item
      trigger={<Image fluid bordered centered rounded src={`https://crafatar.com/avatars/${user.id}?size=36&overlay=true`} />}
      icon={null}
    >
      <Dropdown.Menu>
        <MenuLink name={user.name} href={'/player/' + user.id} />
        <MenuLink name='Settings' href='/account' />
        <Menu.Item name='Logout' onClick={handleLogout} disabled={state.loggingOut} />
      </Dropdown.Menu>
    </Dropdown>
  )
}
