import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Button from './Button'
import ErrorMessages from './ErrorMessages'
import { useMutateApi } from '../utils'
import ServerSelector from './admin/ServerSelector'
import TextArea from './TextArea'
import InputCharCounter from './InputCharCounter'

export default function PlayerNoteForm ({ serverFilter, onFinished, query, parseVariables, disableServers = false, defaults = {} }) {
  const { handleSubmit, formState, register, control, watch } = useForm({
    defaultValues: {
      message: '',
      ...defaults,
      server: defaults?.server
    }
  })
  const watchMessage = watch('message')
  const { isSubmitting } = formState

  const { load, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) onFinished()
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
      <TextArea
        required
        label='Message'
        minLength={1}
        maxLength={255}
        className='!-mb-6'
        {...register('message')}
      />
      <InputCharCounter currentLength={watchMessage?.length} maxLength={255} />
      <Button disabled={isSubmitting || !watchMessage?.length} loading={isSubmitting} className='mt-6'>
        Save
      </Button>
    </form>
  )
}
