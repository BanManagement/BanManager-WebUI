import { AiOutlinePlus } from 'react-icons/ai'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Loader from '../../../components/Loader'
import ErrorLayout from '../../../components/ErrorLayout'
import AdminLayout from '../../../components/AdminLayout'
import Button from '../../../components/Button'
import { useApi } from '../../../utils'
import AdminHeader from '../../../components/admin/AdminHeader'
import WebhookItem from '../../../components/admin/webhooks/WebhookItem'
import EmptyState from '../../../components/EmptyState'

export default function Page () {
  const t = useTranslations()
  const { loading, data, errors, mutate } = useApi({
    query: `query {
      listWebhooks {
        total
        records {
          id
          type
          url
          templateType
          examplePayload
          server {
            id
            name
          }
          updated
        }
      }
    }`
  })
  const onDeleted = ({ deleteWebhook }) => {
    const rules = data.listWebhooks.records.filter(s => s.id !== deleteWebhook.id)

    mutate({ ...data, listWebhooks: { records: rules } }, false)
  }

  if (loading) return <AdminLayout title={t('pages.admin.loading')}><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const items = data?.listWebhooks?.records?.map(row => <WebhookItem key={row.id} row={row} onDeleted={onDeleted} />)

  return (
    <AdminLayout title={t('pages.admin.webhooks.title')}>
      <AdminHeader title={t('pages.admin.webhooks.title')}>
        <div>
          <Link href='/admin/webhooks/add' passHref>

            <Button className='bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2'><AiOutlinePlus className='text-xl -ml-1 mr-2' /> {t('pages.admin.webhooks.addWebhook')}</Button>

          </Link>
        </div>
      </AdminHeader>
      <div className='lg:col-span-3'>
        {loading && <Loader />}
        {items.length
          ? items
          : (
            <EmptyState title={t('pages.admin.webhooks.emptyTitle')} subTitle={t('pages.admin.webhooks.emptySubtitle')}>
              <Link href='/admin/webhooks/add' passHref>

                <Button className='w-44 bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2'><AiOutlinePlus className='text-xl -ml-1 mr-2' /> {t('pages.admin.webhooks.addAWebhook')}</Button>

              </Link>
            </EmptyState>
            )}
      </div>
    </AdminLayout>
  )
}
