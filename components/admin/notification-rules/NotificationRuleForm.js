import { useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Button from '../../Button'
import PageHeader from '../AdminHeader'
import ErrorMessages from '../../ErrorMessages'
import Select from '../../Select'
import ServerSelector from '../ServerSelector'
import { useMutateApi } from '../../../utils'

export default function NotificationRuleForm ({ onFinished, query, parseVariables, notificationTypes, roles, defaults = {} }) {
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
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto w-full'>
      <ErrorMessages ref={errorRef} errors={errors} />
      <PageHeader title='Notification Type' className='!text-xl' />
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
      <PageHeader title='Roles' className='!text-xl' />
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
      <PageHeader title='Server (optional)' className='!text-xl' />
      <Controller
        name='serverId'
        control={control}
        defaultValue={false}
        render={({ field }) => <ServerSelector isClearable className='mb-6' placeholder='Server' {...field} />}
      />
      <Button data-cy='submit-server-form' disabled={isSubmitting} loading={loading}>Save</Button>
    </form>
  )
}
