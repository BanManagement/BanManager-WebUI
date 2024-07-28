import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MdLock, MdOutlineEmail } from 'react-icons/md'
import Input from './Input'
import Button from './Button'
import { useRouter } from 'next/router'

export default function PlayerRegisterForm () {
  const router = useRouter()
  const [error, setError] = useState(null)
  const { handleSubmit, formState, register } = useForm()
  const { isSubmitting } = formState

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      return setError(new Error('Passwords do not match'))
    }

    try {
      const response = await fetch((process.env.BASE_PATH || '') + '/api/register',
        {
          method: 'POST',
          body: JSON.stringify(data),
          headers: new Headers({ 'Content-Type': 'application/json' }),
          credentials: 'include'
        })

      if (response.status !== 204) {
        const responseData = await response.json()

        throw new Error(responseData.error)
      }

      router.push('/dashboard')
    } catch (e) {
      setError(e)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto w-full'>
      <div className='flex flex-col relative w-full'>
        <Input
          required
          label='Email address'
          minLength={6}
          type='email'
          icon={<MdOutlineEmail />}
          iconPosition='left'
          data-cy='email'
          autoFocus
          {...register('email')}
        />
        <Input
          required
          label='Password'
          minLength={6}
          type='password'
          icon={<MdLock />}
          iconPosition='left'
          data-cy='password'
          description='Must be at least 6 characters long'
          {...register('password')}
        />
        <Input
          required
          label='Confirm Password'
          minLength={6}
          type='password'
          icon={<MdLock />}
          iconPosition='left'
          data-cy='password'
          error={error?.message}
          {...register('confirmPassword')}
        />
        <Button data-cy='submit-register' disabled={isSubmitting} loading={isSubmitting}>
          Confirm
        </Button>
      </div>
    </form>
  )
}
