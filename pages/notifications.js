import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import { useUser } from '../utils'
import NotificationList from '../components/notifications/NotificationList'

function Page () {
  useUser({ redirectTo: '/login', redirectIfFound: false })

  return (
    <DefaultLayout title='Notifications'>
      <PageContainer>
        <PageHeader title='Notifications' className='!text-left' />
        <NotificationList />
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
