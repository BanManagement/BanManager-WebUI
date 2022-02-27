import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Button from './Button'
import TextArea from './TextArea'
import ErrorMessages from './ErrorMessages'
import { useMutateApi } from '../utils'

export default function PlayerCommentForm ({ onFinish, parseVariables, query }) {
  const { handleSubmit, formState, register, setValue } = useForm({ defaultValues: { comment: '' } })
  const { isSubmitting } = formState
  const { load, loading, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) {
      setValue('comment', '')
      onFinish(data)
    }
  }, [data])

  const onSubmit = (data) => {
    load(parseVariables(data))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto flex flex-wrap'>
      <ErrorMessages errors={errors} />
      <TextArea
        className='w-full'
        required
        maxLength='250'
        placeholder='Leave a comment'
        {...register('comment')}
      />
      <div className='-mr-1'>
        <Button data-cy='submit-report-comment-form' disabled={isSubmitting} loading={loading}>Comment</Button>
      </div>
    </form>
  )
}
