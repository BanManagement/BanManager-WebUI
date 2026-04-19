import { useRouter } from 'next/router'
import { useTranslations } from 'next-intl'
import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import PlayerLoginPasswordForm from '../components/PlayerLoginPasswordForm'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import { useUser } from '../utils'

function Page () {
  const router = useRouter()
  const t = useTranslations('pages.login')
  const { user } = useUser({ redirectIfFound: true, redirectTo: '/dashboard' })
  const onSuccess = () => {
    router.push('/dashboard')
  }

  return (
    <DefaultLayout title={t('title')} loading={user}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader title={t('title')} subTitle={t('subtitle')} />
          <PlayerLoginPasswordForm onSuccess={onSuccess} showForgotPassword />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
