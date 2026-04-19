import { useRouter } from 'next/router'
import { useTranslations } from 'next-intl'
import Loader from '../../../components/Loader'
import AdminLayout from '../../../components/AdminLayout'
import ErrorLayout from '../../../components/ErrorLayout'
import PageHeader from '../../../components/PageHeader'
import { useApi, useInvalidateApiCache } from '../../../utils'
import ServerForm from '../../../components/admin/ServerForm'

export default function Page () {
  const t = useTranslations()
  const router = useRouter()
  const invalidate = useInvalidateApiCache()
  const { loading, data, errors } = useApi({
    query: `query server {
      serverTables
    }`
  })

  if (loading) return <AdminLayout title={t('pages.admin.loading')}><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const query = ` mutation createServer($input: CreateServerInput!) {
    createServer(input: $input) {
      id
    }
  }`

  return (
    <AdminLayout title={t('pages.admin.servers.addServer')}>
      <PageHeader title={t('pages.admin.servers.addServer')} />
      <ServerForm
        query={query}
        serverTables={data.serverTables}
        parseVariables={(input) => ({ input })}
        onFinished={() => {
          invalidate('query servers')
          router.push('/admin/servers')
        }}
      />
    </AdminLayout>
  )
}
