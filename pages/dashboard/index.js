import ActivePunishments from '../../components/dashboard/ActivePunishments'
import PlayerAppeals from '../../components/dashboard/PlayerAppeals'
import PlayerReports from '../../components/dashboard/PlayerReports'
import DefaultLayout from '../../components/DefaultLayout'
import Loader from '../../components/Loader'
import PageContainer from '../../components/PageContainer'
import PageHeader from '../../components/PageHeader'
import PlayerStatistics from '../../components/player/PlayerStatistics'
import { useUser } from '../../utils'

export default function Page () {
  const { user } = useUser({ redirectTo: '/login', redirectIfFound: false })

  if (!user) return <Loader />

  return (
    <DefaultLayout title='Dashboard'>
      <PageContainer>
        <PageHeader title='Dashboard' />
        <div className='space-y-10'>
          <PlayerStatistics id={user.id} />
          <div>
            <h2 className='text-lg font-bold pb-4 border-b border-accent-200 leading-none'>Active Punishments</h2>
            <ActivePunishments id={user.id} />
          </div>
          <div>
            <PlayerAppeals id={user.id} title='Your appeals' />
          </div>
          <div>
            <PlayerReports id={user.id} title='Your reports' />
          </div>
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}
