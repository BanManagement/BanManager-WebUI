import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { MdLock, MdOutlineEmail } from 'react-icons/md'
import Input from './Input'
import Button from './Button'
import { useRouter } from 'next/router'
import { translateRestError } from '../utils/locale'

export default function PlayerRegisterForm () {
  const router = useRouter()
  const t = useTranslations()
  const [error, setError] = useState(null)
  const { handleSubmit, formState, register } = useForm()
  const { isSubmitting } = formState

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      return setError(new Error(t('forms.passwordMismatch')))
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

        throw translateRestError(t, responseData)
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
          label={t('forms.email')}
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
          label={t('forms.password')}
          minLength={6}
          type='password'
          icon={<MdLock />}
          iconPosition='left'
          data-cy='password'
          description={t('forms.minLength', { n: 6 })}
          {...register('password')}
        />
        <Input
          required
          label={t('forms.confirmPassword')}
          minLength={6}
          type='password'
          icon={<MdLock />}
          iconPosition='left'
          data-cy='confirm-password'
          error={error?.message}
          {...register('confirmPassword')}
        />
        <Button data-cy='submit-register' disabled={isSubmitting} loading={isSubmitting}>
          {t('common.continue')}
        </Button>
      </div>
    </form>
  )
}
