import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import Input from './Input'
import Button from './Button'
import ErrorMessages from './ErrorMessages'
import { useMutateApi } from '../utils'
import ServerSelector from './admin/ServerSelector'
import { FaPencilAlt } from 'react-icons/fa'
import ExpiresInput from './ExpiresInput'

export default function PlayerBanForm ({ serverFilter, onFinished, query, parseVariables, disableServers = false, defaults = {}, submitRef = null }) {
  const t = useTranslations()
  const { handleSubmit, formState, register, control } = useForm({ defaultValues: { ...defaults, server: defaults?.server, expires: defaults?.expires * 1000 || 0 } })
  const { isSubmitting } = formState
  const { load, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key])) onFinished(data)
  }, [data])

  const onSubmit = (data) => load(parseVariables(data))

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ErrorMessages errors={errors} />
      <Controller
        name='server'
        control={control}
        defaultValue={false}
        rules={{ required: true }}
        render={({ field }) => (
          <ServerSelector
            className='mb-6'
            {...field}
            isDisabled={disableServers}
            filter={serverFilter}
          />
        )}
      />
      <Input
        required
        label={t('forms.reason')}
        icon={<FaPencilAlt />}
        data-cy='reason'
        {...register('reason')}
      />
      <div data-cy='expires'>
        <Controller
          name='expires'
          control={control}
          render={({ field: { onChange, value } }) => <ExpiresInput onChange={onChange} value={value} />}
        />
      </div>
      <Button data-cy='submit-ban' ref={submitRef} disabled={isSubmitting} loading={isSubmitting} className={submitRef ? 'hidden' : ''}>
        {t('common.save')}
      </Button>
    </form>
  )
}
