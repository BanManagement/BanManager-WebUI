import { AiOutlinePlus } from 'react-icons/ai'
import Link from 'next/link'
import Loader from '../../../components/Loader'
import ErrorLayout from '../../../components/ErrorLayout'
import AdminLayout from '../../../components/AdminLayout'
import Button from '../../../components/Button'
import { useApi } from '../../../utils'
import AdminHeader from '../../../components/admin/AdminHeader'
import NotificationRuleItem from '../../../components/admin/notification-rules/NotificationRuleItem'
import EmptyState from '../../../components/EmptyState'

export default function Page () {
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

  if (loading) return <AdminLayout title='Loading...'><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const items = data?.listNotificationRules?.records?.map(row => <NotificationRuleItem key={row.id} row={row} onDeleted={onDeleted} />)

  return (
    <AdminLayout title='Notification Rules'>
      <AdminHeader title='Notification Rules'>
        <div>
          <Link href='/admin/notification-rules/add' passHref>

            <Button className='bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2'><AiOutlinePlus className='text-xl -ml-1 mr-2' /> Add Rule</Button>

          </Link>
        </div>
      </AdminHeader>
      <div className='lg:col-span-3'>
        {loading && <Loader />}
        {items.length
          ? items
          : (
            <EmptyState title={'There\'s nothing here'} subTitle='Notification rules will appear here, try creating one!'>
              <Link href='/admin/notification-rules/add' passHref>

                <Button className='w-44 bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2'><AiOutlinePlus className='text-xl -ml-1 mr-2' /> Create a rule</Button>

              </Link>
            </EmptyState>
            )}
      </div>
    </AdminLayout>
  )
}
