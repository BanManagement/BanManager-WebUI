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

  return (
    <Panel>
      <PageHeader title={user ? user.name : 'Sign In'} subTitle={user ? 'My Account' : 'Already have an account?'} />
      <div className='flex items-center'>
        {user
          ? (
            <div className='flex flex-col items-center w-full gap-2'>
              <Avatar type='body' height='148' width='66' uuid={user.id} />
              <Link href='/dashboard' passHref>
                <Button>My Dashboard</Button>
              </Link>
            </div>
            )
          : <PlayerLoginPasswordForm onSuccess={handleLogin} showForgotPassword />}
      </div>
    </Panel>
  )
}

export default AccountPanel
