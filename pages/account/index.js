import Link from 'next/link'
import { FaPencilAlt } from 'react-icons/fa'
import { MdLock, MdOutlineEmail } from 'react-icons/md'
import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import Avatar from '../../components/Avatar'
import Loader from '../../components/Loader'
import { useUser } from '../../utils'

export default function Page () {
  const { user } = useUser({ redirectTo: '/login' })

  if (!user) return <DefaultLayout><Loader /></DefaultLayout>

  return (
    <DefaultLayout title={`Settings for ${user.name}`}>
      <PageContainer>
        <div className='mx-auto flex flex-col w-full max-w-md px-4 py-8 sm:px-6 md:px-8 lg:px-10 text-center md:border-2 md:rounded-lg md:border-black'>
          <h2 className='text-xs tracking-widest title-font mb-5 font-medium uppercase'>Settings</h2>
          <div className='w-24 mx-auto mb-2'>
            <Avatar uuid={user.id} height='96' width='96' />
          </div>
          <h1 className='text-2xl font-bold pb-4 mb-4 border-b border-accent-200 leading-none'>{user.name}</h1>
          <div className='border-b pb-4'>
            {!user.hasAccount &&
              <Link href='/register' passHref>
                <a className='px-6 py-3 hover:bg-accent-500 flex items-center'>
                  <div className='flex'>
                    <FaPencilAlt className='mx-auto block w-5 h-5 text-lg' />
                    <p className='ml-6'>Register</p>
                  </div>
                </a>
              </Link>}
            {user.hasAccount &&
              <Link href='/account/email' passHref>
                <a className='px-6 py-3 hover:bg-accent-500 flex items-center'>
                  <div className='flex'>
                    <MdOutlineEmail className='mx-auto block w-5 h-5 text-lg' />
                    <p className='ml-6'>Email</p>
                  </div>
                </a>
              </Link>}
            {user.hasAccount &&
              <Link href='/account/password' passHref>
                <a className='px-6 py-3 hover:bg-accent-500 flex items-center'>
                  <div className='flex'>
                    <MdLock className='mx-auto block w-5 h-5 text-lg' />
                    <p className='ml-6'>Password</p>
                  </div>
                </a>
              </Link>}
          </div>
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}
