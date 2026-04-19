import { useRouter } from 'next/router'
import { useTranslations } from 'next-intl'
import Loader from '../../../components/Loader'
import AdminLayout from '../../../components/AdminLayout'
import ErrorLayout from '../../../components/ErrorLayout'
import PageHeader from '../../../components/PageHeader'
import { useApi, useInvalidateApiCache } from '../../../utils'
import NotificationRuleForm from '../../../components/admin/notification-rules/NotificationRuleForm'

export default function Page () {
  const t = useTranslations()
  const router = useRouter()
  const invalidate = useInvalidateApiCache()
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

  if (loading) return <AdminLayout title={t('pages.admin.loading')}><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const query = ` mutation createNotificationRule($input: NotificationRuleInput!) {
    createNotificationRule(input: $input) {
      id
    }
  }`
  const roles = data.roles.filter(role => role.id > 1).map(role => ({ value: role.id, label: role.name }))
  const notificationTypes = data.__type.enumValues.map(type => ({ value: type.name, label: type.name }))

  return (
    <AdminLayout title={t('pages.admin.notificationRules.addRule')}>
      <PageHeader title={t('pages.admin.notificationRules.addRule')} />
      <div className='mx-auto flex flex-col max-w-md'>
        <NotificationRuleForm
          query={query}
          roles={roles}
          notificationTypes={notificationTypes}
          parseVariables={(input) => ({ input })}
          onFinished={() => {
            invalidate('listNotificationRules')
            router.push('/admin/notification-rules')
          }}
        />
      </div>
    </AdminLayout>
  )
}
