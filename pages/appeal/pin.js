import { useRouter } from 'next/router'
import { useTranslations } from 'next-intl'
import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import PlayerLoginPinForm from '../../components/PlayerLoginPinForm'
import { useUser } from '../../utils'
import Panel from '../../components/Panel'
import AppealStepHeader from '../../components/appeal/AppealStepHeader'

function Page () {
  const t = useTranslations('pages.appeal')
  const router = useRouter()
  const { user } = useUser({ redirectIfFound: true, redirectTo: '/appeal/punishment' })
  const onSuccess = () => {
    router.push('/appeal/punishment')
  }

  return (
    <DefaultLayout title={t('pinLoginDocument')} loading={user}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <AppealStepHeader step={1} title={t('stepHeader.step1')} nextStep={t('stepHeader.selectPunishment')} />
          <PlayerLoginPinForm onSuccess={onSuccess} />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
