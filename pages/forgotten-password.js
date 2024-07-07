import { useRouter } from 'next/router'
import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import PlayerLoginPinForm from '../components/PlayerLoginPinForm'
import { useUser } from '../utils'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'

function Page () {
  const router = useRouter()
  const { user } = useUser({ redirectIfFound: true, redirectTo: '/dashboard' })
  const onSuccess = ({ responseData }) => {
    if (responseData.hasAccount) return router.push('/account/password')

    router.push('/dashboard')
  }

  return (
    <DefaultLayout title='Forgotten Password' loading={user}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader title='Forgotten Password' subTitle='Help' />
          <PlayerLoginPinForm onSuccess={onSuccess} showHint />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
