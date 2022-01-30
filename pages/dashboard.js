import DefaultLayout from '../components/DefaultLayout'
import PageHeader from '../components/PageHeader'
import { useUser } from '../utils'

export default function Page () {
  const { user } = useUser({ redirectTo: '/login', redirectIfFound: false })

  return (
    <DefaultLayout title='Dashboard'>
      <div className='bg-primary-500 text-white md:pb-0 pb-8'>
        <div className='container px-5 mx-auto'>
          <PageHeader title='Dashboard' />
        </div>
      </div>
    </DefaultLayout>
  )
}
