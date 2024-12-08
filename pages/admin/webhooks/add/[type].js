import { useRouter } from 'next/router'
import Loader from '../../../../components/Loader'
import AdminLayout from '../../../../components/AdminLayout'
import ErrorLayout from '../../../../components/ErrorLayout'
import PageHeader from '../../../../components/PageHeader'
import { useApi } from '../../../../utils'
import WebhookForm from '../../../../components/admin/webhooks/WebhookForm'
import WebhookDiscordForm from '../../../../components/admin/webhooks/WebhookDiscordForm'

export default function Page () {
  const router = useRouter()
  const { type } = router.query
  const { loading, data, errors } = useApi({
    query: `query roles {
      webhookTypes: __type(name: "WebhookType") {
        enumValues {
          name
        }
      }
      webhookContentTypes: __type(name: "WebhookContentType") {
        enumValues {
          name
        }
      }
    }`
  })

  if (loading) return <AdminLayout title='Loading...'><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />
  if (type !== 'discord' && type !== 'custom') return <ErrorLayout errors={[{ message: 'Invalid webhook type' }]} />

  const query = ` mutation createWebhook($input: CreateWebhookInput!) {
    createWebhook(input: $input) {
      id
    }
  }`
  const webhookTypes = data.webhookTypes.enumValues.map(type => ({ value: type.name, label: type.name }))
  const webhookContentTypes = data.webhookContentTypes.enumValues.map(type => ({ value: type.name, label: type.name }))
  const title = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <AdminLayout title={`Add ${title} Webhook`}>
      <PageHeader title={`Add ${title} Webhook`} />
      <div className='flex flex-col'>
        {type === 'discord'
          ? (
            <WebhookDiscordForm
              query={query}
              eventTypes={webhookTypes}
              contentTypes={webhookContentTypes}
              parseVariables={(input) => ({ input })}
              onFinished={() => router.push('/admin/webhooks')}
            />
            )
          : (
            <WebhookForm
              query={query}
              eventTypes={webhookTypes}
              contentTypes={webhookContentTypes}
              parseVariables={(input) => ({ input })}
              onFinished={() => router.push('/admin/webhooks')}
            />
            )}
      </div>
    </AdminLayout>
  )
}
