import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Input from './Input'
import Button from './Button'
import ErrorMessages from './ErrorMessages'
import { useMutateApi } from '../utils'
import ServerSelector from './admin/ServerSelector'

export default function PlayerNoteForm ({ serverFilter, onFinished, query, parseVariables, disableServers = false, defaults = {} }) {
  const { handleSubmit, formState, register, control } = useForm({
    defaultValues: {
      ...defaults,
      server: defaults?.server
    }
  })
  const { isSubmitting } = formState

  const { load, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) onFinished()
  }, [data])

  const onSubmit = (data) => {
    load(parseVariables(data))
  }

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
        name='message'
        placeholder='Message'
        {...register('message')}
      />
      <Button disabled={isSubmitting} loading={isSubmitting}>
        Save
      </Button>
    </form>
  )
}
