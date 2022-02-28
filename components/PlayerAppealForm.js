import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import Button from './Button'
import TextArea from './TextArea'
import ErrorMessages from './ErrorMessages'
import { fromNow, useMutateApi } from '../utils'
import Badge from './Badge'
import Avatar from './Avatar'

export default function PlayerAppealForm ({ actor, reason, expires, created, server, onFinished, parseVariables }) {
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

  const onSubmit = (data) => {
    load(parseVariables(data))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto'>
      <ErrorMessages errors={errors} />
      <p className='leading-relaxed mb-4 text-left'>{reason}</p>
      <div className='flex border-t border-gray-200 py-2'>
        <span>By</span>
        <span className='ml-auto'>
          <Link href={`/player/${actor.id}`} passHref>
            <a>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <Avatar uuid={actor.id} height='20' width='20' />
                </div>
                <div className='ml-3'>
                  <p className='whitespace-no-wrap'>
                    {actor.name}
                  </p>
                </div>
              </div>
            </a>
          </Link>
        </span>
      </div>
      <div className='flex border-t border-gray-200 py-2'>
        <span>Server</span>
        <span className='ml-auto'>{server.name}</span>
      </div>
      <div className='flex border-t border-b border-gray-200 py-2 mb-4'>
        <span>Expires</span>
        <span className='ml-auto'>
          {expires === 0
            ? <Badge className='bg-red-600'>Never</Badge>
            : <Badge className='bg-blue-600'>{fromNow(expires)}</Badge>}
        </span>
      </div>
      <TextArea
        className='w-full'
        required
        rows={6}
        placeholder='Why should this punishment be removed?'
        {...register('reason')}
      />
      <Button className='bg-blue-600 hover:bg-blue-900' disabled={isSubmitting} loading={isSubmitting}>
        Appeal
      </Button>
    </form>
  )
}
