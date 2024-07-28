import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { MdLock } from 'react-icons/md'
import Input from './Input'
import Button from './Button'
import { useMutateApi, useUser } from '../utils'
import { useRouter } from 'next/router'

export default function ResetPasswordForm () {
  const router = useRouter()
  const { user } = useUser()
  const [error, setError] = useState(null)
  const { handleSubmit, formState, register, reset } = useForm()
  const { isSubmitting } = formState

  const { load, data, errors } = useMutateApi({
    query: `mutation setPassword($currentPassword: String, $newPassword: String!) {
    setPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      id
    }
  }`
  })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) {
      reset()
      router.push('/account')
    }
  }, [data])

  const onSubmit = async (data) => {
    if (data.confirmPassword !== data.newPassword) {
      setError(new Error('Passwords do not match'))
    } else {
      setError(null)
      return load(data)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto w-full'>
      <div className='flex flex-col relative w-full'>
        {user?.session?.type === 'password' &&
          <Input
            required
            label='Current password'
            minLength={6}
            type='password'
            icon={<MdLock />}
            iconPosition='left'
            data-cy='currentPassword'
            {...register('currentPassword')}
          />}
        <Input
          required
          label='New password'
          minLength={6}
          type='password'
          icon={<MdLock />}
          iconPosition='left'
          data-cy='newPassword'
          description='Must be at least 6 characters long'
          {...register('newPassword')}
        />
        <Input
          required
          label='Confirm new password'
          type='password'
          minLength={6}
          icon={<MdLock />}
          iconPosition='left'
          data-cy='confirmPassword'
          error={error?.message || errors?.[0]?.message}
          {...register('confirmPassword')}
        />
        <Button data-cy='submit-password-change' disabled={isSubmitting} loading={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  )
}
