import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import { useUser } from '../utils'
import NotificationList from '../components/notifications/NotificationList'
import PushNotificationButton from '../components/notifications/PushNotificationButton'

function Page () {
  const { user } = useUser({ redirectTo: '/login', redirectIfFound: false })

  return (
    <DefaultLayout title='Notifications'>
      <PageContainer>
        <PageHeader title='Notifications' containerClassName='!justify-between'>
          {typeof window !== 'undefined' && 'Notification' in window && user && <PushNotificationButton />}
        </PageHeader>
        <NotificationList />
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
