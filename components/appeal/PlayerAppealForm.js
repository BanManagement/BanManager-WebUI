import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Button from '../Button'
import TextArea from '../TextArea'
import ErrorMessages from '../ErrorMessages'
import { useMutateApi } from '../../utils'
import AppealPunishment from './AppealPunishment'

export default function PlayerAppealForm ({ actor, reason, expires, created, server, type, onFinished, parseVariables }) {
  const { handleSubmit, formState, register } = useForm({ defaultValues: { reason: '' } })
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
        {...register('reason')}
      />
      <Button disabled={isSubmitting} loading={isSubmitting}>
        Appeal
      </Button>
    </form>
  )
}
