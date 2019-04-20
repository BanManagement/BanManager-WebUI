import React from 'react'
import withData from 'lib/withData'
import AdminLayout from 'components/AdminLayout'
import RolesQuery from 'components/queries/RolesQuery'
import {
  Button,
  List,
  Header
} from 'semantic-ui-react'
import RoleItem from 'components/admin/RoleItem'
import { Router } from 'routes'
import gql from 'graphql-tag'
import AssignPlayersRoleForm from 'components/admin/AssignPlayersRoleForm'
import PlayersTable from 'components/admin/PlayersTable'
import ServersQuery from 'components/queries/ServersQuery'

const globalRoleMutation = gql`
  mutation assignRole($players: [UUID!]!, $role: Int!) {
    assignRole(players: $players, role: $role) {
      id
    }
  }
`

const serverRoleMutation = gql`
  mutation assignRole($players: [UUID!]!, $serverId: ID!, $role: Int!) {
    assignServerRole(players: $players, serverId: $serverId, role: $role) {
      id
    }
  }
`

export class RolesPage extends React.Component {
  clickRouteHandler = (route, params) => () => Router.pushRoute(route, params)

  render () {
    return (
      <AdminLayout title='Roles' displayNavTitle>
        <Button.Group size='medium' widths='1'>
          <Button circular icon='plus' color='green' onClick={this.clickRouteHandler('admin-add-role')} />
        </Button.Group>
        <List celled verticalAlign='bottom'>
          <RolesQuery>
            {({ roles }) => {
              return roles.map(role => (
                <RoleItem key={role.id} {...role} />
              ))
            }}
          </RolesQuery>
        </List>
        <Header>Assign Global Player Roles</Header>
        <p>Takes priority over server roles, and applies globally across the site</p>
        <AssignPlayersRoleForm mutation={globalRoleMutation} />
        <Header>Assign Server Player Roles</Header>
        <p>Only affects certain actions where a server is applicable, e.g. bans</p>
        <ServersQuery>
          {({ servers }) => (
            <>
              <AssignPlayersRoleForm mutation={serverRoleMutation} servers={servers} />
              <Header>Players</Header>
              <PlayersTable servers={servers} />
            </>
          )}
        </ServersQuery>
      </AdminLayout>
    )
  }
}

export default withData(RolesPage)
