import { useRouter } from 'next/router'
import AdminLayout from '../../../../components/AdminLayout'
import ErrorLayout from '../../../../components/ErrorLayout'
import Loader from '../../../../components/Loader'
import { useApi } from '../../../../utils'
import AdminHeader from '../../../../components/admin/AdminHeader'
import WebhookForm from '../../../../components/admin/webhooks/WebhookForm'
import WebhookDiscordForm from '../../../../components/admin/webhooks/WebhookDiscordForm'
import Button from '../../../../components/Button'
import Link from 'next/link'

export default function Page () {
  const router = useRouter()
  const { id } = router.query
  const { loading, data, errors, mutate } = useApi({
    variables: { id },
    query: !id
      ? null
      : `query webhook($id: ID!) {
      webhook(id: $id) {
        id
        templateType
        contentType
        contentTemplate
        url
        type
        server {
          id
          name
        }
      }
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

  const query = ` mutation updateWebhook($id: ID!, $input: UpdateWebhookInput!) {
    updateWebhook(id: $id, input: $input) {
      id
      templateType
      contentType
      contentTemplate
      url
      type
      server {
        id
        name
      }
    }
  }`
  const webhookTypes = data.webhookTypes.enumValues.map(type => ({ value: type.name, label: type.name }))
  const webhookContentTypes = data.webhookContentTypes.enumValues.map(type => ({ value: type.name, label: type.name }))

  return (
    <AdminLayout title={`Edit Webhook #${data.webhook.id}`}>
      <AdminHeader title='Edit Webhook'>
        <div>
          <Link href={`/admin/webhooks/${data.webhook.id}/deliveries`} passHref>
            <Button className='bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2'>Deliveries</Button>
          </Link>
        </div>
      </AdminHeader>
      {data.webhook.templateType === 'DISCORD'
        ? (
          <div className='flex flex-col'>
            <WebhookDiscordForm
              defaults={data.webhook}
              query={query}
              eventTypes={webhookTypes}
              parseVariables={(input) => ({ id, input })}
              onFinished={({ updateWebhook }) => {
                mutate({ ...data, webhook: { ...updateWebhook } }, false)
                router.push('/admin/webhooks')
              }}
            />
          </div>)
        : (
          <div className='flex flex-col'>
            <WebhookForm
              defaults={data.webhook}
              query={query}
              eventTypes={webhookTypes}
              contentTypes={webhookContentTypes}
              parseVariables={(input) => ({ id, input })}
              onFinished={({ updateWebhook }) => {
                mutate({ ...data, webhook: { ...updateWebhook } }, false)
                router.push('/admin/webhooks')
              }}
            />
          </div>
          )}
    </AdminLayout>
  )
}
