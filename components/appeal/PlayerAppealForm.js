import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Button from '../Button'
import TextArea from '../TextArea'
import ErrorMessages from '../ErrorMessages'
import { useMutateApi } from '../../utils'
import AppealPunishment from './AppealPunishment'
import InputCharCounter from '../InputCharCounter'
import CommentWithUpload, { AttachButton } from '../CommentWithUpload'

export default function PlayerAppealForm ({ actor, reason, expires, created, server, type, onFinished, parseVariables, canUpload = false }) {
  const { handleSubmit, formState, control, watch } = useForm({ defaultValues: { reason: '' } })
  const watchReason = watch('reason')
  const { isSubmitting } = formState
  const [documentIds, setDocumentIds] = useState([])

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

  const onSubmit = (data) => {
    const variables = parseVariables(data)
    if (documentIds.length > 0) {
      variables.input.documents = documentIds
    }
    load(variables)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
      <AppealPunishment punishment={{ actor, reason, expires, created, server, type }} open />
      <ErrorMessages errors={errors} />
      {canUpload
        ? (
          <Controller
            name='reason'
            control={control}
            rules={{ required: true, minLength: 20 }}
            render={({ field }) => (
              <CommentWithUpload
                {...field}
                required
                rows={6}
                label='Why should this punishment be removed?'
                minLength={20}
                maxLength={2000}
                placeholder='Explain why this punishment should be removed...'
                documents={documentIds}
                onDocumentsChange={setDocumentIds}
                maxFiles={5}
                disabled={isSubmitting}
              >
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2'>
                  <AttachButton disabled={isSubmitting} />
                  <InputCharCounter currentLength={watchReason.length} minLength={20} maxLength={2000} />
                </div>
              </CommentWithUpload>
            )}
          />
          )
        : (
          <>
            <Controller
              name='reason'
              control={control}
              rules={{ required: true, minLength: 20 }}
              render={({ field }) => (
                <TextArea
                  {...field}
                  required
                  rows={6}
                  label='Why should this punishment be removed?'
                  minLength={20}
                  maxLength={2000}
                  className='!-mb-6'
                />
              )}
            />
            <InputCharCounter currentLength={watchReason.length} minLength={20} maxLength={2000} />
          </>
          )}
      <Button data-cy='submit-appeal' disabled={isSubmitting || watchReason.length < 20} loading={isSubmitting}>
        Appeal
      </Button>
    </form>
  )
}
