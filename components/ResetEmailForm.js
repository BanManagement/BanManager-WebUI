import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { MdLock, MdOutlineEmail } from 'react-icons/md'
import ErrorMessages from './ErrorMessages'
import Message from './Message'
import Input from './Input'
import Button from './Button'
import { useMutateApi } from '../utils'

export default function ResetEmailForm () {
  const [success, setSuccess] = useState(false)
  const { handleSubmit, formState, register } = useForm()
  const { isSubmitting } = formState

  const { load, data, errors } = useMutateApi({
    query: `mutation setEmail($currentPassword: String!, $email: String!) {
    setEmail(currentPassword: $currentPassword, email: $email) {
      id
    }
  }`
  })

  useEffect(() => {
    setSuccess(false)
  }, [errors])
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) setSuccess(true)
  }, [data])

  const onSubmit = async (data) => load(data)

  return (
    <>
      {success &&
        <Message success data-cy='success'>
          <Message.Header>Email updated</Message.Header>
        </Message>}
      <form onSubmit={handleSubmit(onSubmit)} className='mx-auto'>
        <div className='flex flex-col relative w-full max-w-md px-4 sm:px-6 md:px-8 lg:px-10'>
          <ErrorMessages errors={errors} />
          <Input
            required
            placeholder='New email address'
            type='email'
            icon={<MdOutlineEmail />}
            iconPosition='left'
            data-cy='email'
            {...register('email')}
          />
          <Input
            required
            placeholder='Current password'
            type='password'
            icon={<MdLock />}
            iconPosition='left'
            data-cy='currentPassword'
            {...register('currentPassword')}
          />
          <Button data-cy='submit-email-change' disabled={isSubmitting} loading={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </>
  )
}
