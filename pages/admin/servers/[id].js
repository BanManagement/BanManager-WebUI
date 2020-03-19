import { useRouter } from 'next/router'
import { Loader } from 'semantic-ui-react'
import AdminLayout from '../../../components/AdminLayout'
import GraphQLErrorMessage from '../../../components/GraphQLErrorMessage'
import { useApi } from '../../../utils'
import ServerForm from '../../../components/admin/ServerForm'

export default function Page () {
  const router = useRouter()
  const { id } = router.query
  const { loading, data } = useApi({
    variables: { id },
    query: `query server($id: ID!) {
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
  }, {
    loadOnReload: false,
    loadOnReset: false
  })

  if (loading) return <Loader active />
  if (!data) return <GraphQLErrorMessage error={{ networkError: true }} />

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
