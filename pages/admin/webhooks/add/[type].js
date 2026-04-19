import { useRouter } from 'next/router'
import { useTranslations } from 'next-intl'
import Loader from '../../../../components/Loader'
import AdminLayout from '../../../../components/AdminLayout'
import ErrorLayout from '../../../../components/ErrorLayout'
import PageHeader from '../../../../components/PageHeader'
import { useApi, useInvalidateApiCache } from '../../../../utils'
import WebhookForm from '../../../../components/admin/webhooks/WebhookForm'
import WebhookDiscordForm from '../../../../components/admin/webhooks/WebhookDiscordForm'

export default function Page () {
  const t = useTranslations()
  const router = useRouter()
  const invalidate = useInvalidateApiCache()
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

  if (loading) return <AdminLayout title={t('pages.admin.loading')}><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />
  if (type !== 'discord' && type !== 'custom') return <ErrorLayout errors={[{ message: t('pages.admin.webhooks.invalidType') }]} />

  const query = ` mutation createWebhook($input: CreateWebhookInput!) {
    createWebhook(input: $input) {
      id
    }
  }`
  const webhookTypes = data.webhookTypes.enumValues.map(type => ({ value: type.name, label: type.name }))
  const webhookContentTypes = data.webhookContentTypes.enumValues.map(type => ({ value: type.name, label: type.name }))
  const title = t(`pages.admin.webhooks.${type}`)
  const headerTitle = t('pages.admin.webhooks.addWebhookType', { type: title })

  return (
    <AdminLayout title={headerTitle}>
      <PageHeader title={headerTitle} />
      <div className='flex flex-col'>
        {type === 'discord'
          ? (
            <WebhookDiscordForm
              query={query}
              eventTypes={webhookTypes}
              contentTypes={webhookContentTypes}
              parseVariables={(input) => ({ input })}
              onFinished={() => {
                invalidate('listWebhooks')
                router.push('/admin/webhooks')
              }}
            />
            )
          : (
            <WebhookForm
              query={query}
              eventTypes={webhookTypes}
              contentTypes={webhookContentTypes}
              parseVariables={(input) => ({ input })}
              onFinished={() => {
                invalidate('listWebhooks')
                router.push('/admin/webhooks')
              }}
            />
            )}
      </div>
    </AdminLayout>
  )
}
