import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { MdLock } from 'react-icons/md'
import ErrorMessages from './ErrorMessages'
import Message from './Message'
import Input from './Input'
import Button from './Button'
import { useMutateApi, useUser } from '../utils'

export default function ResetPasswordForm () {
  const { user } = useUser()
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
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
    setSuccess(false)
  }, [errors])
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) {
      reset()
      setSuccess(true)
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
    <>
      {success &&
        <Message success data-cy='success'>
          <Message.Header>Password updated</Message.Header>
        </Message>}
      <form onSubmit={handleSubmit(onSubmit)} className='mx-auto'>
        <div className='flex flex-col relative w-full max-w-md px-4 sm:px-6 md:px-8 lg:px-10'>
          <ErrorMessages errors={errors} error={error} />
          {user?.session?.type === 'password' &&
            <Input
              required
              placeholder='Current password'
              type='password'
              icon={<MdLock />}
              iconPosition='left'
              data-cy='currentPassword'
              {...register('currentPassword')}
            />}
          <Input
            required
            placeholder='New password'
            type='password'
            icon={<MdLock />}
            iconPosition='left'
            data-cy='newPassword'
            {...register('newPassword')}
          />
          <Input
            required
            placeholder='Confirm new password'
            type='password'
            icon={<MdLock />}
            iconPosition='left'
            data-cy='confirmPassword'
            {...register('confirmPassword')}
          />
          <Button data-cy='submit-password-change' disabled={isSubmitting} loading={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </>
  )
}
