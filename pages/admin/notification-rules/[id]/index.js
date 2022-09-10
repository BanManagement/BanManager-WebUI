import { useRouter } from 'next/router'
import AdminLayout from '../../../../components/AdminLayout'
import ErrorLayout from '../../../../components/ErrorLayout'
import Loader from '../../../../components/Loader'
import { useApi } from '../../../../utils'
import PageHeader from '../../../../components/admin/AdminHeader'
import NotificationRuleForm from '../../../../components/admin/notification-rules/NotificationRuleForm'

export default function Page () {
  const router = useRouter()
  const { id } = router.query
  const { loading, data, errors, mutate } = useApi({
    variables: { id },
    query: !id
      ? null
      : `query notificationRule($id: ID!) {
      notificationRule(id: $id) {
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
      }
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

  const query = `mutation updateNotificationRule($id: ID!, $input: NotificationRuleInput!) {
    updateNotificationRule(id: $id, input: $input) {
      id
      type
      server {
        id
      }
      roles {
        id
      }
    }
  }`
  const roles = data.roles.filter(role => role.id > 1).map(role => ({ value: role.id, label: role.name }))
  const notificationTypes = data.__type.enumValues.map(type => ({ value: type.name, label: type.name }))

  return (
    <AdminLayout title={`Edit notification rule #${data.notificationRule.id}`}>
      <PageHeader title='Edit Notification Rule' />
      <div className='mx-auto flex flex-col max-w-md'>
        <NotificationRuleForm
          defaults={data.notificationRule}
          query={query}
          roles={roles}
          notificationTypes={notificationTypes}
          parseVariables={(input) => ({ id, input })}
          onFinished={({ updateNotificationRule }) => {
            mutate({ ...data, notificationRule: { ...updateNotificationRule } }, false)
            router.push('/admin/notification-rules')
          }}
        />
      </div>
    </AdminLayout>
  )
}
