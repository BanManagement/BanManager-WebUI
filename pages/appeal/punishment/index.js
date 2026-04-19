import { useTranslations } from 'next-intl'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import { useUser } from '../../../utils'
import Panel from '../../../components/Panel'
import AppealStepHeader from '../../../components/appeal/AppealStepHeader'
import PunishmentPicker from '../../../components/appeal/PunishmentPicker'

function Page () {
  const t = useTranslations('pages.appeal')
  const { user } = useUser({ redirectIfFound: false, redirectTo: '/appeal' })

  return (
    <DefaultLayout title={t('punishmentDocumentTitle')} loading={!user}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <AppealStepHeader step={2} title={t('stepHeader.selectPunishment')} nextStep={t('stepHeader.writeAppeal')} />
          <PunishmentPicker />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
