import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { MdLock, MdOutlineEmail } from 'react-icons/md'
import Input from './Input'
import Button from './Button'
import { useMutateApi } from '../utils'
import { useRouter } from 'next/router'

export default function ResetEmailForm () {
  const router = useRouter()
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
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) router.push('/account')
  }, [data])

  const onSubmit = async (data) => load(data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto w-full'>
      <div className='flex flex-col relative w-full'>
        <Input
          required
          label='New email address'
          type='email'
          icon={<MdOutlineEmail />}
          iconPosition='left'
          data-cy='email'
          {...register('email')}
        />
        <Input
          required
          label='Current password'
          type='password'
          icon={<MdLock />}
          iconPosition='left'
          data-cy='currentPassword'
          error={errors ? errors?.[0]?.message : null}
          {...register('currentPassword')}
        />
        <Button data-cy='submit-email-change' disabled={isSubmitting} loading={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  )
}
