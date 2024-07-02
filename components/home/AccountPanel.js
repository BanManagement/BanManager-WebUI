import { mutate } from 'swr'
import Link from 'next/link'
import PlayerLoginPasswordForm from '../PlayerLoginPasswordForm'
import Avatar from '../Avatar'
import Button from '../Button'
import { useUser } from '../../utils'
import PageHeader from '../PageHeader'
import Panel from '../Panel'

const AccountPanel = () => {
  const { user } = useUser()
  const handleLogin = () => {
    mutate('/api/user')
  }
  const handleLogout = async () => {
    // Using cookies for SSR instead of local storage, which are set to HttpOnly
    // requires server to delete cookie
    const response = await fetch((process.env.BASE_PATH || '') + '/api/logout',
      {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        credentials: 'include'
      })

    if (response.status !== 204) {
      const responseData = await response.json()

      throw new Error(responseData.error)
    }

    mutate('/api/user')
  }

  return (
    <Panel>
      <PageHeader title={user ? user.name : 'Sign In'} subTitle={user ? 'My Account' : 'Already have an account?'} />
      <div className='flex items-center'>
        {user
          ? (
            <div className='grid grid-cols-2 gap-8'>
              <div className='grid-flow-col'>
                <Avatar type='body' height='200' width='88' uuid={user.id} />
              </div>
              <div className='grid-flow-col grid gap-2 grid-rows-2'>
                <div className='grid-flow-row'>
                  <Link href='/dashboard' passHref>
                    <Button>View Dashboard</Button>
                  </Link>
                </div>
                <div className='grid-flow-row'>
                  <Button onClick={handleLogout}>Logout</Button>
                </div>
              </div>
            </div>
            )
          : <PlayerLoginPasswordForm onSuccess={handleLogin} />}
      </div>
    </Panel>
  )
}

export default AccountPanel
