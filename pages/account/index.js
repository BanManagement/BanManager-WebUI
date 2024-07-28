import { FaPencilAlt } from 'react-icons/fa'
import { MdLock, MdOutlineEmail } from 'react-icons/md'
import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import Avatar from '../../components/Avatar'
import { useUser } from '../../utils'
import Panel from '../../components/Panel'
import PageHeader from '../../components/PageHeader'
import Dropdown from '../../components/Dropdown'

export default function Page () {
  const { user } = useUser({ redirectTo: '/login' })

  return (
    <DefaultLayout title='Account' loading={!user}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader subTitle='Account' title={user?.name} />
          <div className='mx-auto mb-6'>
            <Avatar uuid={user?.id} height='64' width='64' />
          </div>
          {user?.hasAccount ? <RegisteredAccountMenu email={user?.email} /> : <UnregisteredAccountMenu />}
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}

const UnregisteredAccountMenu = () => {
  return (
    <div className='flex flex-col'>
      <Dropdown.Item name='Register' className='rounded-t-3xl' href='/account/register' icon={<FaPencilAlt />} />
    </div>
  )
}

const RegisteredAccountMenu = ({ email }) => {
  return (
    <div className='flex flex-col divide-y divide-primary-400'>
      <Dropdown.Item name={email || 'Email'} className='rounded-t-3xl' href='/account/email' icon={<MdOutlineEmail />} />
      <Dropdown.Item name='Password' className='rounded-b-3xl' href='/account/password' icon={<MdLock />} />
    </div>
  )
}
