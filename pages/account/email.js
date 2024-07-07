import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import ResetEmailForm from '../../components/ResetEmailForm'
import PageHeader from '../../components/PageHeader'
import { useUser } from '../../utils'
import Panel from '../../components/Panel'

export default function Page () {
  const { user } = useUser({ redirectTo: '/login' })

  return (
    <DefaultLayout title='Change Email | Account' loading={!user}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader title='Change Email' subTitle='Account' />
          <ResetEmailForm />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
