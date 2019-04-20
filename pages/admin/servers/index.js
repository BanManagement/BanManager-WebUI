import React from 'react'
import withData from '../../../lib/withData'
import withSession from '../../../lib/withSession'
import AdminLayout from '../../../components/AdminLayout'
import ServersQuery from '../../../components/queries/ServersQuery'
import { Router } from '../../../routes'
import {
  Button,
  List
} from 'semantic-ui-react'

export class AdminPage extends React.Component {
  clickRouteHandler = (route, params) => () => Router.pushRoute(route, params)

  render () {
    return (
      <AdminLayout title='Servers' displayNavTitle>
        <Button.Group size='medium' widths='1'>
          <Button circular icon='plus' color='green' onClick={this.clickRouteHandler('admin-add-server')} />
        </Button.Group>
        <List celled verticalAlign='bottom'>
          <ServersQuery>
            {({ servers }) => {
              const canDelete = servers.length !== 1

              return servers.map(server => (
                <List.Item key={server.id} onClick={this.clickRouteHandler('admin-edit-server', { id: server.id })}>
                  { canDelete &&
                    <List.Content floated='right'>
                      <Button color='red' icon='trash' />
                    </List.Content>
                  }
                  <List.Content>
                    {server.name}
                  </List.Content>
                </List.Item>
              ))
            }}
          </ServersQuery>
        </List>
      </AdminLayout>
    )
  }
}

export default withData(AdminPage)
