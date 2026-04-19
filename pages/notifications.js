import { useTranslations } from 'next-intl'
import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import { useUser } from '../utils'
import NotificationList from '../components/notifications/NotificationList'
import PushNotificationButton from '../components/notifications/PushNotificationButton'

function Page () {
  const t = useTranslations()
  const { user } = useUser({ redirectTo: '/login', redirectIfFound: false })

  return (
    <DefaultLayout title={t('pages.notifications.documentTitle')}>
      <PageContainer>
        <PageHeader title={t('pages.notifications.title')} containerClassName='!justify-between'>
          {typeof window !== 'undefined' && 'Notification' in window && user && <PushNotificationButton />}
        </PageHeader>
        <NotificationList />
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
