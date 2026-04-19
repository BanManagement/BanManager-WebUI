import { useRouter } from 'next/router'
import { useTranslations } from 'next-intl'
import Loader from '../../../components/Loader'
import AdminLayout from '../../../components/AdminLayout'
import ErrorLayout from '../../../components/ErrorLayout'
import { useApi, useInvalidateApiCache } from '../../../utils'
import RoleForm from '../../../components/admin/RoleForm'

export default function Page () {
  const t = useTranslations()
  const router = useRouter()
  const invalidate = useInvalidateApiCache()
  const { id } = router.query
  const { loading, data, errors, mutate } = useApi({
    variables: { id },
    query: !id
      ? null
      : `query role($id: ID!) {
      role(id: $id) {
        id
        name
        parent
        resources {
          id
          name
          permissions {
            id
            name
            allowed
          }
        }
      }
      roles(defaultOnly: true) {
        id
        name
      }
    }`
  })

  if (loading) return <AdminLayout title={t('pages.admin.loading')}><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const query = `mutation updateRole($id: ID!, $input: UpdateRoleInput!) {
    updateRole(id: $id, input: $input) {
      id
      name
      parent
      resources {
        id
        name
        permissions {
          id
          name
          allowed
        }
      }
    }
  }`
  const parentRoles = data.roles.map(role => ({ value: role.id, label: role.name }))

  return (
    <AdminLayout title={t('pages.admin.roles.editTitle', { name: data.role.name })}>
      <RoleForm
        defaults={data.role}
        query={query}
        parentRoles={parentRoles}
        resources={data.role.resources}
        parseVariables={(input) => ({ id, input })}
        onFinished={({ updateRole }) => {
          mutate({ ...data, role: { ...updateRole } }, false)
          invalidate('rolesAdminPage')
          router.push('/admin/roles')
        }}
      />
    </AdminLayout>
  )
}
