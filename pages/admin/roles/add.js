import { useRouter } from 'next/router'
import Loader from '../../../components/Loader'
import AdminLayout from '../../../components/AdminLayout'
import ErrorLayout from '../../../components/ErrorLayout'
import { useApi, useInvalidateApiCache } from '../../../utils'
import RoleForm from '../../../components/admin/RoleForm'

export default function Page () {
  const router = useRouter()
  const invalidate = useInvalidateApiCache()
  const { loading, data, errors } = useApi({
    query: `query parentRoles {
      roles(defaultOnly: true) {
        id
        name
      }
      resources {
        id
        name
        permissions {
          id
          name
          allowed
        }
      }
    }`
  })

  if (loading) return <AdminLayout title='Loading...'><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const query = `mutation createRole($input: UpdateRoleInput!) {
    createRole(input: $input) {
      id
    }
  }`
  const parentRoles = data.roles.map(role => ({ value: role.id, label: role.name }))

  return (
    <AdminLayout title='Add Role'>
      <RoleForm
        query={query}
        parentRoles={parentRoles}
        resources={data.resources}
        parseVariables={(input) => ({ input })}
        onFinished={() => {
          invalidate('rolesAdminPage')
          router.push('/admin/roles')
        }}
      />
    </AdminLayout>
  )
}
