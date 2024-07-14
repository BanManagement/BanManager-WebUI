import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Button from './Button'
import TextArea from './TextArea'
import ErrorMessages from './ErrorMessages'
import { useMutateApi } from '../utils'

export default function PlayerCommentForm ({ onFinish, parseVariables, query }) {
  const { handleSubmit, formState, register, setValue, watch } = useForm({ defaultValues: { comment: '' } })
  const { isSubmitting } = formState
  const { load, loading, data, errors } = useMutateApi({ query })
  const watchComment = watch('comment')

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) {
      setValue('comment', '')
      onFinish(data)
    }
  }, [data])

  const onSubmit = (data) => load(parseVariables(data))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto flex flex-col flex-wrap'>
      <ErrorMessages errors={errors} />
      <TextArea
        required
        className='!-mb-2'
        maxLength='250'
        placeholder='Add your comment here...'
        {...register('comment')}
      />
      <div className='md:self-end'>
        <Button data-cy='submit-report-comment-form' disabled={isSubmitting || !watchComment.length} loading={loading}>Comment</Button>
      </div>
    </form>
  )
}
