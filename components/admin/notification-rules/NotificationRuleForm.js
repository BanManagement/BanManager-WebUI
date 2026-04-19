import { useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import Button from '../../Button'
import PageHeader from '../AdminHeader'
import ErrorMessages from '../../ErrorMessages'
import Select from '../../Select'
import ServerSelector from '../ServerSelector'
import { useMutateApi } from '../../../utils'

export default function NotificationRuleForm ({ onFinished, query, parseVariables, notificationTypes, roles, defaults = {} }) {
  const t = useTranslations()
  const errorRef = useRef(null)
  const { handleSubmit, formState, control } = useForm({
    defaultValues: {
      type: defaults?.type,
      serverId: defaults?.server?.id,
      roles: defaults?.roles?.map(role => role.id)
    }
  })
  const { isSubmitting } = formState

  const { load, loading, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => data[key] && data[key].id)) onFinished(data)
  }, [data])
  useEffect(() => {
    if (errors) errorRef.current.scrollIntoView()
  }, [errors])

  const onSubmit = (data) => {
    const { id, ...input } = data

    load(parseVariables(input))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto w-full' data-cy='notification-rule-form'>
      <ErrorMessages ref={errorRef} errors={errors} />
      <PageHeader title={t('pages.admin.notificationRules.form.type')} className='!text-xl' />
      <div data-cy='notification-rule-type'>
        <Controller
          name='type'
          control={control}
          rules={{ required: true }}
          render={({ field }) => <Select
            className='mb-6'
            {...field}
            onChange={(selectedOption) => {
              field.onChange(selectedOption.value)
            }}
            options={notificationTypes}
                                 />}
        />
      </div>
      <PageHeader title={t('pages.admin.notificationRules.form.roles')} className='!text-xl' />
      <div data-cy='notification-rule-roles'>
        <Controller
          name='roles'
          control={control}
          rules={{ required: true }}
          render={({ field }) => <Select
            isMulti
            className='mb-6'
            {...field}
            options={roles}
            onChange={(selectedOption) => {
              field.onChange(selectedOption.map(option => ({ id: option.value })))
            }}
                                 />}
        />
      </div>
      <PageHeader title={t('pages.admin.notificationRules.form.serverOptional')} className='!text-xl' />
      <div data-cy='notification-rule-server'>
        <Controller
          name='serverId'
          control={control}
          defaultValue={false}
          render={({ field }) => <ServerSelector isClearable className='mb-6' placeholder={t('pages.admin.notificationRules.form.server')} {...field} />}
        />
      </div>
      <Button data-cy='submit-notification-rule-form' disabled={isSubmitting} loading={loading}>{t('common.save')}</Button>
    </form>
  )
}
