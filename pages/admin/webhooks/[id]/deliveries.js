import { useRouter } from 'next/router'
import AdminLayout from '../../../../components/AdminLayout'
import ErrorLayout from '../../../../components/ErrorLayout'
import Loader from '../../../../components/Loader'
import { useApi } from '../../../../utils'
import AdminHeader from '../../../../components/admin/AdminHeader'
import WebhookDeliveryItem from '../../../../components/admin/webhooks/WebhookDeliveryItem'

export default function Page () {
  const router = useRouter()
  const { id } = router.query
  const { loading, data, errors } = useApi({
    variables: { id },
    query: !id
      ? null
      : `query listWebhookDeliveries($id: ID!) {
      listWebhookDeliveries(webhookId: $id) {
        total
        records {
          id
          content
          response
          error
          created
        }
      }
    }`
  })

  if (loading) return <AdminLayout title='Loading...'><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const items = data?.listWebhookDeliveries?.records?.map(row => (<WebhookDeliveryItem key={`delivery-${row.id}`} {...row} />))

  return (
    <AdminLayout title={`Webhook #${id} Deliveries`}>
      <AdminHeader title='Webhook Deliveries' />
      <div className='flex flex-col gap-3'>
        {loading && <Loader />}
        {items.length
          ? items
          : (
            <div className='bg-white shadow overflow-hidden sm:rounded-md'>
              <div className='px-4 py-5 sm:px-6'>
                <h3 className='text-lg leading-6 font-medium text-gray-900'>No webhook deliveries</h3>
                <p className='mt-1 max-w-2xl text-sm text-gray-500'>Webhook deliveries will appear here once the webhook has been triggered.</p>
              </div>
            </div>
            )}
      </div>
    </AdminLayout>
  )
}
