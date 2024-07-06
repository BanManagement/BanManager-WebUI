import { useRouter } from 'next/router'
import DefaultLayout from '../../../components/DefaultLayout'
import PageContainer from '../../../components/PageContainer'
import { useUser } from '../../../utils'
import Panel from '../../../components/Panel'
import AppealStepHeader from '../../../components/appeal/AppealStepHeader'
import PunishmentPicker from '../../../components/appeal/PunishmentPicker'

function Page () {
  const router = useRouter()
  const { user } = useUser({ redirectIfFound: false, redirectTo: '/appeal' })

  return (
    <DefaultLayout title='Select Punishment | Appeal' loading={!user}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <AppealStepHeader step={2} title='Select Punishment' nextStep='Write Appeal' />
          <PunishmentPicker />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
