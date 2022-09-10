import { useRouter } from 'next/router'
import Loader from '../../../components/Loader'
import AdminLayout from '../../../components/AdminLayout'
import ErrorLayout from '../../../components/ErrorLayout'
import PageHeader from '../../../components/PageHeader'
import { useApi } from '../../../utils'
import NotificationRuleForm from '../../../components/admin/notification-rules/NotificationRuleForm'

export default function Page () {
  const router = useRouter()
  const { loading, data, errors } = useApi({
    query: `query roles {
      roles {
        id
        name
      }
      __type(name: "NotificationType") {
        enumValues {
          name
        }
      }
    }`
  })

  if (loading) return <AdminLayout title='Loading...'><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const query = ` mutation createNotificationRule($input: NotificationRuleInput!) {
    createNotificationRule(input: $input) {
      id
    }
  }`
  const roles = data.roles.filter(role => role.id > 1).map(role => ({ value: role.id, label: role.name }))
  const notificationTypes = data.__type.enumValues.map(type => ({ value: type.name, label: type.name }))

  return (
    <AdminLayout title='Add Notification Rule'>
      <PageHeader title='Add Notification Rule' />
      <div className='mx-auto flex flex-col max-w-md'>
        <NotificationRuleForm
          query={query}
          roles={roles}
          notificationTypes={notificationTypes}
          parseVariables={(input) => ({ input })}
          onFinished={() => router.push('/admin/notification-rules')}
        />
      </div>
    </AdminLayout>
  )
}
