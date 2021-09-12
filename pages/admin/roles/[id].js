import { useRouter } from 'next/router'
import { Loader } from 'semantic-ui-react'
import AdminLayout from '../../../components/AdminLayout'
import ErrorLayout from '../../../components/ErrorLayout'
import { useApi } from '../../../utils'
import RoleForm from '../../../components/admin/RoleForm'

export default function Page () {
  const router = useRouter()
  const { id } = router.query
  const { loading, data, errors } = useApi({
    variables: { id },
    query: !id ? null : `query role($id: ID!) {
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

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorLayout errors={errors} />

  const query = `mutation updateRole($id: ID!, $input: UpdateRoleInput!) {
    updateRole(id: $id, input: $input) {
      id
    }
  }`

  return (
    <AdminLayout title={`Edit ${data.role.name}`}>
      <RoleForm
        defaults={data.role}
        query={query}
        parentRoles={data.roles}
        resources={data.role.resources}
        parseVariables={(input) => ({ id, input })}
        onFinished={() => router.push('/admin/roles')}
      />
    </AdminLayout>
  )
}
