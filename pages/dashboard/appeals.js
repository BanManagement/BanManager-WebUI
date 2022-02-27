import PlayerAppeals from '../../components/dashboard/PlayerAppeals'
import DefaultLayout from '../../components/DefaultLayout'
import Loader from '../../components/Loader'
import PageContainer from '../../components/PageContainer'
import PageHeader from '../../components/PageHeader'
import { useUser } from '../../utils'

export default function Page () {
  const { user } = useUser({ redirectTo: '/login', redirectIfFound: false })

  if (!user) return <Loader />

  return (
    <DefaultLayout title='Appeals | Dashboard'>
      <PageContainer>
        <PageHeader title='Dashboard' />
        <PlayerAppeals title='Appeals' />
      </PageContainer>
    </DefaultLayout>
  )
}
