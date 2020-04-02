import { useRouter } from 'next/router'
import { Loader } from 'semantic-ui-react'
import AdminLayout from '../../../components/AdminLayout'
import ErrorMessages from '../../../components/ErrorMessages'
import { useApi } from '../../../utils'
import ServerForm from '../../../components/admin/ServerForm'

export default function Page () {
  const router = useRouter()
  const { id } = router.query
  const { loading, data, errors } = useApi({
    variables: { id },
    query: `query server {
      serverTables
    }`
  }, {
    loadOnReload: false,
    loadOnReset: false
  })

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorMessages { ...errors } />

  const query = ` mutation createServer($input: CreateServerInput!) {
    createServer(input: $input) {
      id
    }
  }`

  return (
    <AdminLayout title='Add Server'>
      <ServerForm
        query={query}
        serverTables={data.serverTables}
        parseVariables={(input) => ({ input })}
        onFinished={() => router.push('/admin/servers')}
      />
    </AdminLayout>
  )
}
