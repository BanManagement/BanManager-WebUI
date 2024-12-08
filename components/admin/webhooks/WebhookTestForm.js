import { useForm } from 'react-hook-form'
import Button from '../../Button'
import Input from '../../Input'
import { useMutateApi } from '../../../utils'

export default function WebhookTestForm ({ query, id, variables = {} }) {
  const { handleSubmit, register } = useForm({ defaultValues: variables })
  const { load, loading, data, errors } = useMutateApi({ query })

  const onSubmit = (data) => {
    load({ id, variables: data })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto w-full'>
      {Object.keys(variables).map(variable => (
        <div key={variable} className='mb-4'>
          <Input
            label={variable}
            placeholder={variable}
            {...register(variable)}
          />
        </div>
      ))}
      <Button type='submit' disabled={loading} loading={loading}>Send</Button>
      {data && <WebhookResponse {...data.sendTestWebhook} />}
      {errors && <div className='mt-4 text-red-500'>Error sending webhook: {JSON.stringify(errors, null, 2)}</div>}
    </form>
  )
}

const WebhookResponse = ({ content, response }) => {
  return (
    <div className='mt-3 overflow-auto'>
      <h2 className='font-semibold'>{response.status} {response.statusText}</h2>
      <pre>Body {JSON.stringify(response.body, null, 2)}</pre>
      <pre>Headers {JSON.stringify(response.headers, null, 2)}</pre>
      <pre>Content {content}</pre>
    </div>
  )
}
