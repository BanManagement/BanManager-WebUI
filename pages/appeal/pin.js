import { useRouter } from 'next/router'
import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import PlayerLoginPinForm from '../../components/PlayerLoginPinForm'
import { useUser } from '../../utils'
import Panel from '../../components/Panel'
import AppealStepHeader from '../../components/appeal/AppealStepHeader'

function Page () {
  const router = useRouter()
  const { user } = useUser({ redirectIfFound: true, redirectTo: '/appeal/punishment' })
  const onSuccess = () => {
    router.push('/appeal/punishment')
  }

  return (
    <DefaultLayout title='Login | Appeal' loading={user}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <AppealStepHeader step={1} title='Pin Login' nextStep='Select Punishment' />
          <PlayerLoginPinForm onSuccess={onSuccess} />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
