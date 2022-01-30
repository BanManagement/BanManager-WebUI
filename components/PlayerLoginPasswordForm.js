import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MdLock, MdOutlineEmail } from 'react-icons/md'
import Link from 'next/link'
import ErrorMessages from './ErrorMessages'
import Input from './Input'
import Button from './Button'

export default function PlayerLoginPasswordForm ({ onSuccess }) {
  const [error, setError] = useState(null)
  const { handleSubmit, formState, register } = useForm()
  const { isSubmitting } = formState

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/session',
        {
          method: 'POST',
          body: JSON.stringify(data),
          headers: new Headers({ 'Content-Type': 'application/json' }),
          credentials: 'include'
        })

      if (response.status !== 204) {
        const responseData = await response.json()

        throw new Error(responseData.error)
      } else {
        onSuccess()
      }
    } catch (e) {
      setError(e)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto'>
      <div className='flex flex-col relative w-full max-w-md px-4 sm:px-6 md:px-8 lg:px-10'>
        <ErrorMessages error={error} />
        <Input
          required
          placeholder='Email address'
          type='email'
          icon={<MdOutlineEmail />}
          iconPosition='left'
          data-cy='email'
          {...register('email')}
        />
        <Input
          required
          placeholder='Password'
          type='password'
          icon={<MdLock />}
          iconPosition='left'
          data-cy='password'
          {...register('password')}
        />
        <Link href='/forgotten-password' passHref>
          <a className='text-lg md:text-sm mb-3'>Forgot password?</a>
        </Link>
        <Button data-cy='submit-login-password' disabled={isSubmitting} loading={isSubmitting}>
          Login
        </Button>
      </div>
    </form>
  )
}
