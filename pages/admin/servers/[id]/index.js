import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '../../../../components/AdminLayout'
import ErrorLayout from '../../../../components/ErrorLayout'
import Loader from '../../../../components/Loader'
import { useApi } from '../../../../utils'
import AdminHeader from '../../../../components/admin/AdminHeader'
import Button from '../../../../components/Button'
import ServerBanStats from '../../../../components/admin/servers/stats/ServerBanStats'
import ServerMuteStats from '../../../../components/admin/servers/stats/ServerMuteStats'
import ServerReportStats from '../../../../components/admin/servers/stats/ServerReportStats'
import ServerWarningStats from '../../../../components/admin/servers/stats/ServerWarningStats'
import PlayerActivity from '../../../../components/admin/servers/PlayerActivity'

export default function Page () {
  const router = useRouter()
  const { id } = router.query
  const { loading, data, errors } = useApi({
    variables: { id },
    query: !id
      ? null
      : `query server($id: ID!) {
      server(id: $id) {
        id
        name
      }
    }`
  })

  if (loading) return <AdminLayout title='Loading...'><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  return (
    <AdminLayout title={`Server ${data.server.name}`}>
      <AdminHeader title={data.server.name}>
        <div>
          <Link href={`/admin/servers/${data.server.id}/edit`} passHref>

            <Button className='bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2'>Edit Server</Button>

          </Link>
        </div>
      </AdminHeader>
      <div className='flex flex-wrap gap-8 justify-center md:justify-between'>
        <ServerBanStats server={data.server} />
        <ServerMuteStats server={data.server} />
        <ServerReportStats server={data.server} />
        <ServerWarningStats server={data.server} />
      </div>
      <div className='mt-8'>
        <div>
          <PlayerActivity server={data.server} />
        </div>
      </div>
    </AdminLayout>
  )
}
