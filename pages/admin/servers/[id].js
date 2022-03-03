import { useRouter } from 'next/router'
import AdminLayout from '../../../components/AdminLayout'
import ErrorLayout from '../../../components/ErrorLayout'
import Loader from '../../../components/Loader'
import { useApi } from '../../../utils'
import ServerForm from '../../../components/admin/ServerForm'

export default function Page () {
  const router = useRouter()
  const { id } = router.query
  const { loading, data, errors } = useApi({
    variables: { id },
    query: !id
      ? null
      : `query server($id: ID!) {
      serverTables
      server(id: $id) {
        id
        name
        host
        port
        database
        user
        console {
          id
        }
        tables {
          players
          playerBans
          playerBanRecords
          playerMutes
          playerMuteRecords
          playerKicks
          playerNotes
          playerHistory
          playerPins
          playerReports
          playerReportCommands
          playerReportComments
          playerReportLocations
          playerReportStates
          playerReportLogs
          serverLogs
          playerWarnings
          ipBans
          ipBanRecords
          ipMutes
          ipMuteRecords
          ipRangeBans
          ipRangeBanRecords
        }
      }
    }`
  })

  if (loading) return <AdminLayout title='Loading...'><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const query = `mutation updateServer($id: ID!, $input: UpdateServerInput!) {
    updateServer(id: $id, input: $input) {
      id
    }
  }`

  return (
    <AdminLayout title={`Edit ${data.server.name}`}>
      <ServerForm
        defaults={data.server}
        query={query}
        serverTables={data.serverTables}
        parseVariables={(input) => ({ id, input })}
        onFinished={() => router.push('/admin/servers')}
      />
    </AdminLayout>
  )
}
