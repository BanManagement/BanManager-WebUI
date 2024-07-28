import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import PlayerRegisterForm from '../../components/PlayerRegisterForm'
import PageHeader from '../../components/PageHeader'
import { useUser } from '../../utils'
import { useEffect } from 'react'
import { TiTick } from 'react-icons/ti'
import Panel from '../../components/Panel'
import Button from '../../components/Button'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Page () {
  const router = useRouter()
  const { user } = useUser({ redirectTo: '/login', redirectIfFound: false })

  useEffect(() => {
    if (user && user.hasAccount) {
      router.push('/dashboard')
    }
  }, [user])

  return (
    <DefaultLayout title='Register | Account' loading={!user}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader title='Register' subTitle='Create an account' />
          <div className='bg-primary-900 rounded-3xl grid grid-cols-12 p-2 gap-4 items-center mb-2'>
            <div className='col-span-1'><TiTick /></div>
            <div className='col-span-11'>Login anyplace, anywhere, anytime</div>
            <div className='col-span-1'><TiTick /></div>
            <div className='col-span-11'>Track all punishments including reports</div>
            <div className='col-span-1'><TiTick /></div>
            <div className='col-span-11'>Notifications on appeal updates</div>
          </div>
          <Link href='/dashboard'>
            <Button className='bg-black mb-6' data-cy='submit-register-skip'>
              Skip
            </Button>
          </Link>
          <PlayerRegisterForm />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
