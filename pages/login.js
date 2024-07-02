import { useRouter } from 'next/router'
import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import PlayerLoginPasswordForm from '../components/PlayerLoginPasswordForm'
import Loader from '../components/Loader'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import { useUser } from '../utils'

function Page () {
  const router = useRouter()
  const { user } = useUser({ redirectIfFound: true, redirectTo: '/dashboard' })
  const onSuccess = () => {
    router.push('/dashboard')
  }

  if (user) return <DefaultLayout><Loader active inline='centered' /></DefaultLayout>

  return (
    <DefaultLayout title='Login'>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader title='Login' subTitle='Welcome back' />
          <PlayerLoginPasswordForm onSuccess={onSuccess} />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
