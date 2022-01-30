import { useRouter } from 'next/router'
import Loader from '../../../components/Loader'
import AdminLayout from '../../../components/AdminLayout'
import ErrorMessages from '../../../components/ErrorMessages'
import PageHeader from '../../../components/PageHeader'
import { useApi } from '../../../utils'
import ServerForm from '../../../components/admin/ServerForm'

export default function Page () {
  const router = useRouter()
  const { loading, data, errors } = useApi({
    query: `query server {
      serverTables
    }`
  })

  if (loading) return <Loader />
  if (errors || !data) return <ErrorMessages errors={errors} />

  const query = ` mutation createServer($input: CreateServerInput!) {
    createServer(input: $input) {
      id
    }
  }`

  return (
    <AdminLayout title='Add Server'>
      <PageHeader title='Add Server' />
      <ServerForm
        query={query}
        serverTables={data.serverTables}
        parseVariables={(input) => ({ input })}
        onFinished={() => router.push('/admin/servers')}
      />
    </AdminLayout>
  )
}
