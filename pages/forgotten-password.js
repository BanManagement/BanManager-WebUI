import { useRouter } from 'next/router'
import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import PlayerLoginPinForm from '../components/PlayerLoginPinForm'
import Loader from '../components/Loader'
import { useUser } from '../utils'
import PageHeader from '../components/PageHeader'

function Page () {
  const router = useRouter()
  const { user } = useUser({ redirectIfFound: true, redirectTo: '/dashboard' })
  const onSuccess = ({ responseData }) => {
    if (responseData.hasAccount) return router.push('/account/password')

    router.push('/dashboard')
  }

  if (user) return <DefaultLayout><Loader active inline='centered' /></DefaultLayout>

  return (
    <DefaultLayout title='Forgotten Password'>
      <PageContainer>
        <div className='mx-auto flex flex-col w-full max-w-lg px-4 py-8 sm:px-6 md:px-8 lg:px-10 text-center md:border-2 md:rounded-lg md:border-black'>
          <PageHeader title='Forgotten Password' subTitle='Help' />
          <div className='mt-5'>
            <PlayerLoginPinForm onSuccess={onSuccess} />
          </div>
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
