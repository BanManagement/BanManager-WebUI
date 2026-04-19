import { AiOutlinePlus } from 'react-icons/ai'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Loader from '../../../components/Loader'
import ErrorLayout from '../../../components/ErrorLayout'
import AdminLayout from '../../../components/AdminLayout'
import Button from '../../../components/Button'
import { useApi } from '../../../utils'
import AdminHeader from '../../../components/admin/AdminHeader'
import NotificationRuleItem from '../../../components/admin/notification-rules/NotificationRuleItem'
import EmptyState from '../../../components/EmptyState'

export default function Page () {
  const t = useTranslations()
  const { loading, data, errors, mutate } = useApi({
    query: `query {
      listNotificationRules {
        total
        records {
          id
          type
          roles {
            id
            name
          }
          server {
            id
            name
          }
          updated
        }
      }
    }`
  })
  const onDeleted = ({ deleteNotificationRule }) => {
    const rules = data.listNotificationRules.records.filter(s => s.id !== deleteNotificationRule.id)

    mutate({ ...data, listNotificationRules: { records: rules } }, false)
  }

  if (loading) return <AdminLayout title={t('pages.admin.loading')}><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const items = data?.listNotificationRules?.records?.map(row => <NotificationRuleItem key={row.id} row={row} onDeleted={onDeleted} />)

  return (
    <AdminLayout title={t('pages.admin.notificationRules.title')}>
      <AdminHeader title={t('pages.admin.notificationRules.title')}>
        <div>
          <Link href='/admin/notification-rules/add' passHref>

            <Button className='bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2'><AiOutlinePlus className='text-xl -ml-1 mr-2' /> {t('pages.admin.notificationRules.addRule')}</Button>

          </Link>
        </div>
      </AdminHeader>
      <div className='lg:col-span-3'>
        {loading && <Loader />}
        {items.length
          ? items
          : (
            <EmptyState title={t('pages.admin.notificationRules.emptyTitle')} subTitle={t('pages.admin.notificationRules.emptySubtitle')}>
              <Link href='/admin/notification-rules/add' passHref>

                <Button className='w-44 bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2'><AiOutlinePlus className='text-xl -ml-1 mr-2' /> {t('pages.admin.notificationRules.createRule')}</Button>

              </Link>
            </EmptyState>
            )}
      </div>
    </AdminLayout>
  )
}
