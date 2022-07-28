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
        <div className='mx-auto flex flex-col w-full px-4 py-8 sm:px-6 md:px-8 lg:px-10'>
          <PageHeader title='Notifications' className='text-center' />
          <NotificationList />
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
