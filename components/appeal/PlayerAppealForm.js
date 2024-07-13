import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Button from '../Button'
import TextArea from '../TextArea'
import ErrorMessages from '../ErrorMessages'
import { useMutateApi } from '../../utils'
import AppealPunishment from './AppealPunishment'
import InputCharCounter from '../InputCharCounter'

export default function PlayerAppealForm ({ actor, reason, expires, created, server, type, onFinished, parseVariables }) {
  const { handleSubmit, formState, register, watch } = useForm({ defaultValues: { reason: '' } })
  const watchReason = watch('reason')
  const { isSubmitting } = formState

  const { load, data, errors } = useMutateApi({
    query: `mutation createAppeal($input: CreateAppealInput!) {
      createAppeal(input: $input) {
        id
      }
    }`
  })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) onFinished(data)
  }, [data])

  const onSubmit = (data) => load(parseVariables(data))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
      <AppealPunishment punishment={{ actor, reason, expires, created, server, type }} open />
      <ErrorMessages errors={errors} />
      <TextArea
        required
        rows={6}
        label='Why should this punishment be removed?'
        minLength={20}
        maxLength={2000}
        className='!-mb-6'
        {...register('reason')}
      />
      <InputCharCounter currentLength={watchReason.length} minLength={20} maxLength={2000} />
      <Button disabled={isSubmitting || watchReason.length < 20} loading={isSubmitting}>
        Appeal
      </Button>
    </form>
  )
}
