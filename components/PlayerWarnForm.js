import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Input from './Input'
import Button from './Button'
import ErrorMessages from './ErrorMessages'
import { useMutateApi } from '../utils'
import ServerSelector from './admin/ServerSelector'
import { FaPencilAlt } from 'react-icons/fa'
import { RiNumbersLine } from 'react-icons/ri'
import ExpiresInput from './ExpiresInput'

export default function PlayerWarnForm ({ serverFilter, onFinished, query, parseVariables, disableServers = false, defaults = {}, submitRef = null }) {
  const { handleSubmit, formState, register, control } = useForm({ defaultValues: { ...defaults, server: defaults?.server, expires: defaults?.expires * 1000 || 0, points: defaults?.points || 1 } })
  const { isSubmitting } = formState
  const { load, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) onFinished(data)
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
      <Input
        required
        label='Points'
        type='number'
        min='0'
        step='.01'
        icon={<RiNumbersLine />}
        {...register('points', { valueAsNumber: true })}
      />
      <div>
        <Controller
          name='expires'
          control={control}
          render={({ field: { onChange, value } }) => <ExpiresInput onChange={onChange} value={value} />}
        />
      </div>
      <Button ref={submitRef} disabled={isSubmitting} loading={isSubmitting} className={submitRef ? 'hidden' : ''}>
        Save
      </Button>
    </form>
  )
}
