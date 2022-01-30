import { useRouter } from 'next/router'
import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import PlayerLoginPasswordForm from '../components/PlayerLoginPasswordForm'
import Loader from '../components/Loader'
import PageHeader from '../components/PageHeader'
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
        <div className='mx-auto flex flex-col w-full max-w-md px-4 py-8 sm:px-6 md:px-8 lg:px-10 text-center md:border-2 md:rounded-lg md:border-black'>
          <PageHeader title='Login' subTitle='Welcome back' />
          <div className='mt-5'>
            <PlayerLoginPasswordForm onSuccess={onSuccess} />
          </div>
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
