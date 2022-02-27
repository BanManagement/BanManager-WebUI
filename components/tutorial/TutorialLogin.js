import { mutate } from 'swr'
import PlayerLoginPinForm from '../PlayerLoginPinForm'
import PlayerLoginPasswordForm from '../PlayerLoginPasswordForm'
import Avatar from '../Avatar'
import Button from '../Button'
import { useUser } from '../../utils'

export default function TutorialLogin ({ currentState, handleNext }) {
  const { user } = useUser()
  const { loginType } = currentState.context

  if (user) {
    const handleLogout = async () => {
      // Using cookies for SSR instead of local storage, which are set to HttpOnly
      // requires server to delete cookie
      const response = await fetch('/api/logout',
        {
          method: 'POST',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          credentials: 'include'
        })

      if (response.status !== 204) {
        const responseData = await response.json()

        throw new Error(responseData.error)
      }

      mutate('/api/user')
    }

    return (
      <div className='grid grid-cols-2 gap-8'>
        <div className='grid-flow-col'>
          <Avatar type='body' height='200' width='88' uuid={user.id} />
          <p>{user.name}</p>
        </div>
        <div className='grid-flow-col grid gap-2 grid-rows-2'>
          <div className='grid-flow-row'>
            <a onClick={() => handleNext('Next')}>
              <Button>Continue</Button>
            </a>
          </div>
          <div className='grid-flow-row'>
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {(loginType === 'Not sure, help!' || loginType === 'I have a 6 digit pin') &&
        <div className='space-y-6'>
          <PlayerLoginPinForm onSuccess={() => mutate('/api/user')} />
          <div className='flex flex-col relative w-full max-w-md px-4 sm:px-6 md:px-8 lg:px-10'>
            <Button onClick={() => handleNext('Back')} className='bg-red-600 hover:bg-red-700'>Back</Button>
          </div>
        </div>}
      {loginType === 'I already have an account' &&
        <div className='space-y-6'>
          <PlayerLoginPasswordForm onSuccess={() => mutate('/api/user')} />
          <div className='flex flex-col relative w-full max-w-md px-4 sm:px-6 md:px-8 lg:px-10'>
            <Button onClick={() => handleNext('Back')} className='bg-red-600 hover:bg-red-700'>Back</Button>
          </div>
        </div>}
    </>
  )
}
