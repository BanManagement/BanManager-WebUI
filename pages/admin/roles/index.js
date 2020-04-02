import { Button, Header, List, Loader } from 'semantic-ui-react'
import ErrorLayout from '../../../components/ErrorLayout'
import AdminLayout from '../../../components/AdminLayout'
import RoleItem from '../../../components/admin/RoleItem'
import AssignPlayersRoleForm from '../../../components/admin/AssignPlayersRoleForm'
import { useApi } from '../../../utils'
import PlayersTable from '../../../components/admin/PlayersTable'

export default function Page () {
  const { loading, data, errors } = useApi({
    query: `query {
      roles {
        id
        name
      }
      servers {
        id
        name
      }
    }`
  }, {
    loadOnMount: true,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: false
  })

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorLayout errors={errors} />

  const items = data.roles.map(role => <RoleItem key={role.id} role={role} />)
  const globalRoleMutation = `mutation assignRole($players: [UUID!]!, $role: Int!) {
    assignRole(players: $players, role: $role) {
      id
    }
  }`
  const serverRoleMutation = `mutation assignRole($players: [UUID!]!, $serverId: ID!, $role: Int!) {
    assignServerRole(players: $players, serverId: $serverId, role: $role) {
      id
    }
  }`

  return (
    <AdminLayout title='Roles'>
      <Button.Group size='medium' widths='1'>
        <Button circular icon='plus' color='green' as='a' href='/admin/roles/add' />
      </Button.Group>
      <List celled verticalAlign='bottom'>
        {items}
      </List>
      <Header>Assign Global Player Roles</Header>
      <p>Takes priority over server roles, and applies globally across the site</p>
      <AssignPlayersRoleForm roles={data.roles} query={globalRoleMutation} />
      <Header>Assign Server Player Roles</Header>
      <p>Only affects certain actions where a server is applicable, e.g. bans</p>
      <AssignPlayersRoleForm roles={data.roles} servers={data.servers} query={serverRoleMutation} />
      <PlayersTable roles={data.roles} servers={data.servers} />
    </AdminLayout>
  )
}
