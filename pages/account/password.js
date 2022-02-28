import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import ResetPasswordForm from '../../components/ResetPasswordForm'
import PageHeader from '../../components/PageHeader'
import Loader from '../../components/Loader'
import Button from '../../components/Button'
import { useUser } from '../../utils'
import { useRouter } from 'next/router'

export default function Page () {
  const router = useRouter()
  const { user } = useUser({ redirectTo: '/login' })
  const onBack = () => router.push('/account')

  if (!user) return <DefaultLayout><Loader /></DefaultLayout>

  return (
    <DefaultLayout title='Change Password'>
      <PageContainer>
        <div className='mx-auto flex flex-col w-full max-w-md px-4 py-8 sm:px-6 md:px-8 lg:px-10 text-center md:border-2 md:rounded-lg md:border-black'>
          <PageHeader title='Change Password' subTitle='Settings' />
          <div className='mt-5'>
            <ResetPasswordForm showCurrentPassword={user.type === 'password'} />
            <div className='flex flex-col relative w-full max-w-md px-4 sm:px-6 md:px-8 lg:px-10'>
              <Button className='bg-black mt-5' data-cy='submit-register-skip' onClick={onBack}>
                Back
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}
