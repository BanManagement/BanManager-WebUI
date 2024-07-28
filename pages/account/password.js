import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import ResetPasswordForm from '../../components/ResetPasswordForm'
import PageHeader from '../../components/PageHeader'
import { useUser } from '../../utils'
import Panel from '../../components/Panel'

export default function Page () {
  const { user } = useUser({ redirectTo: '/login' })

  return (
    <DefaultLayout title='Change Password | Account' loading={!user}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader title='Change Password' subTitle='Account' />
          <ResetPasswordForm showCurrentPassword={user?.type === 'password'} />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
