import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MdLock, MdOutlineEmail } from 'react-icons/md'
import ErrorMessages from './ErrorMessages'
import Input from './Input'
import Button from './Button'

export default function PlayerRegisterForm ({ onSuccess, onSkip }) {
  const [error, setError] = useState(null)
  const { handleSubmit, formState, register } = useForm()
  const { isSubmitting } = formState

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      return setError(new Error('Passwords do not match'))
    }

    try {
      const response = await fetch('/api/register',
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

      onSuccess()
    } catch (e) {
      setError(e)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto'>
      <div className='flex flex-col relative w-full px-4 sm:px-6 md:px-8 lg:px-10'>
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
        <a className='text-left text-sm ml-1 text-gray-400 -mt-3 mb-3'>Minimum of 6 characters</a>
        <Input
          required
          placeholder='Confirm Password'
          type='password'
          icon={<MdLock />}
          iconPosition='left'
          data-cy='password'
          {...register('confirmPassword')}
        />
        <Button data-cy='submit-register' disabled={isSubmitting} loading={isSubmitting}>
          Confirm
        </Button>
        <Button className='bg-black mt-5' data-cy='submit-register-skip' disabled={isSubmitting} onClick={onSkip}>
          Maybe later
        </Button>
      </div>
    </form>
  )
}
