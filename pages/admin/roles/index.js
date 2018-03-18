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
import AssignPlayersRoleForm from 'components/admin/AssignPlayersRoleForm'

export class RolesPage extends React.Component {
  clickRouteHandler = (route, params) => () => Router.pushRoute(route, params)

  render() {
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
        <Header>Assign Player Roles</Header>
        <p>Takes priority over server roles, and applies globally across the site</p>
        <AssignPlayersRoleForm />
        <Header>Assign Player Server Roles</Header>
        <p>Only affects certain actions where a server is available, e.g. bans</p>
      </AdminLayout>
    )
  }
}

export default withData(RolesPage)
