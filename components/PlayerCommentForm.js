import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Button from './Button'
import TextArea from './TextArea'
import ErrorMessages from './ErrorMessages'
import CommentWithUpload, { AttachButton } from './CommentWithUpload'
import { useMutateApi } from '../utils'

export default function PlayerCommentForm ({ onFinish, parseVariables, query, canUpload = false }) {
  const { handleSubmit, formState, control, watch, reset } = useForm({ defaultValues: { comment: '' } })
  const { isSubmitting } = formState
  const { load, loading, data, errors } = useMutateApi({ query })
  const watchComment = watch('comment')
  const [documentIds, setDocumentIds] = useState([])

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) {
      reset({ comment: '' })
      setDocumentIds([])
      onFinish(data)
    }
  }, [data])

  const onSubmit = (formData) => {
    const variables = parseVariables(formData)
    if (documentIds.length > 0 && variables.input) {
      variables.input.documents = documentIds
    }
    load(variables)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto flex flex-col flex-wrap w-full'>
      <ErrorMessages errors={errors} />
      {canUpload
        ? (
          <Controller
            name='comment'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CommentWithUpload
                {...field}
                required
                maxLength={250}
                placeholder='Add your comment here...'
                documents={documentIds}
                onDocumentsChange={setDocumentIds}
                maxFiles={3}
                disabled={loading}
              >
                {/* Single action row with attach button and comment button */}
                <div className='flex items-center justify-end gap-4 mt-2 px-2'>
                  <AttachButton disabled={loading} />
                  <Button
                    data-cy='submit-report-comment-form'
                    disabled={isSubmitting || !watchComment.length}
                    loading={loading}
                    style={{ width: 'auto' }}
                  >
                    Comment
                  </Button>
                </div>
              </CommentWithUpload>
            )}
          />
          )
        : (
          <>
            <Controller
              name='comment'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextArea
                  {...field}
                  required
                  className='!-mb-2'
                  maxLength={250}
                  placeholder='Add your comment here...'
                />
              )}
            />
            <div className='flex justify-end mt-2'>
              <Button data-cy='submit-report-comment-form' disabled={isSubmitting || !watchComment.length} loading={loading} style={{ width: 'auto' }}>Comment</Button>
            </div>
          </>
          )}
    </form>
  )
}
