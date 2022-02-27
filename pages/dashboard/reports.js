import PlayerReports from '../../components/dashboard/PlayerReports'
import DefaultLayout from '../../components/DefaultLayout'
import Loader from '../../components/Loader'
import PageContainer from '../../components/PageContainer'
import PageHeader from '../../components/PageHeader'
import { useUser } from '../../utils'

export default function Page () {
  const { user } = useUser({ redirectTo: '/login', redirectIfFound: false })

  if (!user) return <Loader />

  return (
    <DefaultLayout title='Reports | Dashboard'>
      <PageContainer>
        <PageHeader title='Dashboard' />
        <PlayerReports title='Reports' />
      </PageContainer>
    </DefaultLayout>
  )
}
