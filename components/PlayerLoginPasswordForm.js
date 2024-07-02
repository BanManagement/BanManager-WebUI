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
      const response = await fetch((process.env.BASE_PATH || '') + '/api/session',
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
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto w-full'>
      <div className='flex flex-col relative w-full'>
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
        <Link href='/forgotten-password' passHref className='-mt-3 mb-3 text-gray-300'>
          Register or forgotten password?
        </Link>
        <Button data-cy='submit-login-password' disabled={isSubmitting} loading={isSubmitting}>
          Login
        </Button>
      </div>
    </form>
  )
}
