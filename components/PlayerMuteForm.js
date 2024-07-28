import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Input from './Input'
import Checkbox from './Checkbox'
import Button from './Button'
import ErrorMessages from './ErrorMessages'
import { useMutateApi } from '../utils'
import ServerSelector from './admin/ServerSelector'
import { FaPencilAlt } from 'react-icons/fa'
import ExpiresInput from './ExpiresInput'
import Switch from './Switch'

export default function PlayerMuteForm ({ serverFilter, onFinished, query, parseVariables, disableServers = false, defaults = {}, submitRef = null }) {
  const { handleSubmit, formState, register, control } = useForm({
    defaultValues: {
      ...defaults,
      server: defaults?.server,
      expires: defaults?.expires * 1000 || 0,
      soft: defaults?.soft || false
    }
  })
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
        label='Reason'
        icon={<FaPencilAlt />}
        {...register('reason')}
      />
      <div>
        <Controller
          name='expires'
          control={control}
          render={({ field: { onChange, value } }) => <ExpiresInput onChange={onChange} value={value} />}
        />
      </div>
      <Controller
        name='soft'
        control={control}
        render={({ field: { onChange, value } }) => (
          <Switch
            label='Soft'
            description='Hides their messages to others to prevent spam'
            onChange={onChange}
            checked={value}
          />
        )}
      />
      <Button ref={submitRef} disabled={isSubmitting} loading={isSubmitting} className={submitRef ? 'hidden' : ''}>
        Save
      </Button>
    </form>
  )
}
