import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { MdLock, MdOutlineEmail } from 'react-icons/md'
import Link from 'next/link'
import Input from './Input'
import Button from './Button'
import { translateRestError } from '../utils/locale'

export default function PlayerLoginPasswordForm ({ onSuccess, showForgotPassword }) {
  const t = useTranslations()
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

        throw translateRestError(t, responseData)
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
        <Input
          required
          label={t('forms.email')}
          type='email'
          icon={<MdOutlineEmail />}
          iconPosition='left'
          data-cy='email'
          {...register('email')}
        />
        <Input
          required
          label={t('forms.password')}
          type='password'
          icon={<MdLock />}
          iconPosition='left'
          data-cy='password'
          minLength={6}
          error={error?.message}
          {...register('password')}
        />
        {showForgotPassword && (
          <Link href='/forgotten-password' passHref className='-mt-3 mb-3 text-gray-300'>
            {t('pages.login.forgotPassword')}
          </Link>
        )}
        <Button data-cy='submit-login-password' disabled={isSubmitting} loading={isSubmitting}>
          {t('common.login')}
        </Button>
      </div>
    </form>
  )
}
