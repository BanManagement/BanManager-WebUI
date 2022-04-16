import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Input from './Input'
import Checkbox from './Checkbox'
import Button from './Button'
import ErrorMessages from './ErrorMessages'
import DateTimePicker from './DateTimePicker'
import { useMutateApi } from '../utils'
import ServerSelector from './admin/ServerSelector'
import TimeIncrement from './TimeIncrement'

export default function PlayerMuteForm ({ serverFilter, onFinished, query, parseVariables, disableServers = false, defaults = {}, submitRef = null }) {
  const { handleSubmit, formState, register, control, setValue, getValues } = useForm({
    defaultValues: {
      ...defaults,
      server: defaults?.server,
      expires: defaults?.expires * 1000 || 0,
      soft: defaults?.soft || false
    }
  })
  const { isSubmitting } = formState
  const [typeState, setTypeState] = useState(defaults.expires ? 'temporary' : 'permanent')

  const { load, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key])) onFinished(data)
  }, [data])

  const onSubmit = (data) => {
    load(parseVariables(data))
  }
  const toggleExpiry = (e) => {
    e.preventDefault()

    let type = 'permanent'
    let expires = 0

    if (typeState === 'permanent') {
      type = 'temporary'
      expires = Date.now()
    }

    setTypeState(type)
    setValue('expires', expires)
  }
  const disablePast = current => current > new Date()
  const expiryColour = typeState === 'permanent' ? 'bg-red-600 hover:bg-red-900' : 'bg-blue-600 hover:bg-blue-900'
  const expiryLabel = typeState === 'permanent' ? 'Permanent' : 'Temporary'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto'>
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
        name='reason'
        placeholder='Reason'
        {...register('reason')}
      />
      <Button className={`mb-6 ${expiryColour}`} onClick={toggleExpiry}>{expiryLabel}</Button>
      {typeState === 'temporary' &&
        <>
          <div className='flex relative mb-6'>
            <Controller
              name='expires'
              control={control}
              render={({ field: { onChange, value } }) => <DateTimePicker isValidDate={disablePast} onChange={onChange} value={value} />}
            />
          </div>
          <div className='flex relative mb-6 gap-12'>
            <TimeIncrement
              incrementMs={1 * 60 * 60 * 1000}
              getValues={getValues}
              setValue={setValue}
              field='expires'
            >
              +1 hour
            </TimeIncrement>
            <TimeIncrement
              incrementMs={24 * 60 * 60 * 1000}
              getValues={getValues}
              setValue={setValue}
              field='expires'
            >
              +1 day
            </TimeIncrement>
          </div>
        </>}
      <Checkbox
        name='soft'
        label='Soft/Shadow'
        {...register('soft')}
      />
      <Button ref={submitRef} disabled={isSubmitting} loading={isSubmitting} className={submitRef ? 'hidden' : ''}>
        Save
      </Button>
    </form>
  )
}
