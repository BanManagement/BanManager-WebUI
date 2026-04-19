import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import Button from '../../Button'
import Input from '../../Input'
import { useMutateApi } from '../../../utils'

export default function WebhookTestForm ({ query, id, variables = {} }) {
  const t = useTranslations()
  const { handleSubmit, register } = useForm({ defaultValues: variables })
  const { load, loading, data, errors } = useMutateApi({ query })

  const onSubmit = (data) => {
    load({ id, variables: data })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto w-full' data-cy='webhook-test-form'>
      {Object.keys(variables).map(variable => (
        <div key={variable} className='mb-4'>
          <Input
            label={variable}
            placeholder={variable}
            data-cy={`webhook-test-${variable}`}
            {...register(variable)}
          />
        </div>
      ))}
      <Button data-cy='submit-webhook-test' type='submit' disabled={loading} loading={loading}>{t('common.send')}</Button>
      {data && <WebhookResponse {...data.sendTestWebhook} />}
      {errors && <div className='mt-4 text-red-500' data-cy='webhook-test-error'>{t('pages.admin.webhooks.test.errorPrefix')}: {JSON.stringify(errors, null, 2)}</div>}
    </form>
  )
}

const WebhookResponse = ({ content, response }) => {
  const t = useTranslations()
  return (
    <div className='mt-3 overflow-auto' data-cy='webhook-test-response'>
      <h2 className='font-semibold' data-cy='webhook-test-response-status'>{response.status} {response.statusText}</h2>
      <pre>{t('pages.admin.webhooks.delivery.body')} {JSON.stringify(response.body, null, 2)}</pre>
      <pre>{t('pages.admin.webhooks.delivery.headers')} {JSON.stringify(response.headers, null, 2)}</pre>
      <pre>{t('pages.admin.webhooks.test.content')} {content}</pre>
    </div>
  )
}
