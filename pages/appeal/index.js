import Link from 'next/link'
import Button from '../../components/Button'
import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import Panel from '../../components/Panel'
import AppealStepHeader from '../../components/appeal/AppealStepHeader'
import { MdOutlineEmail, MdPin } from 'react-icons/md'
import { useUser } from '../../utils'

function Page () {
  useUser({ redirectIfFound: true, redirectTo: '/appeal/punishment' })

  return (
    <DefaultLayout title='Appeal'>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <AppealStepHeader step={1} title='Pin Login' nextStep='Select Punishment' />
          <p className='mb-6'>First, we need to know who you are.</p>
          <Link href='/appeal/pin'>
            <div className='flex gap-4'>
              <Button className='w-12 h-12'><MdPin /></Button>
              <div>
                <p className='underline'>I have a 6 digit pin, e.g. <code>123456</code></p>
                <p className='text-sm text-gray-400'>This can be found when you join the Minecraft server, either on the ban screen or by using the <code className='bg-primary-900'>/bmpin</code> command.</p>
                <p className='text-sm text-gray-400 mt-2'>Note: this pin expires after 5 minutes.</p>
              </div>
            </div>
          </Link>
          <div className='inline-flex items-center justify-center w-full'>
            <hr className='w-full h-px my-8 bg-primary-900 border-0 ' />
            <span className='absolute px-3 font-medium bg-primary-500 -translate-x-1/2  left-1/2'>OR</span>
          </div>
          <Link href='/appeal/account'>
            <div className='flex gap-4'>
              <Button className='w-12 h-12'><MdOutlineEmail /></Button>
              <div>
                <p className='underline'>I already have an account</p>
                <p className='text-sm text-gray-400'>This is specific for this website and NOT your Microsoft/Mojang credentials.</p>
              </div>
            </div>
          </Link>
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
