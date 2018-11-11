import React from 'react'
import withData from 'lib/withData'
import AdminLayout from 'components/AdminLayout'
import PageLayoutsQuery from 'components/queries/PageLayoutsQuery'
import { List } from 'semantic-ui-react'
import { Router } from 'routes'

export class PageLayoutsPage extends React.Component {
  clickRouteHandler = (route, params) => () => Router.pushRoute(route, params)

  render() {
    return (
      <AdminLayout title='Page Layouts' displayNavTitle>
        <List celled verticalAlign='bottom' size='large'>
          <PageLayoutsQuery>
            {({ pageLayouts }) => {
              return pageLayouts.map(layout => (
                <List.Item key={layout.pathname}>
                  <List.Content onClick={this.clickRouteHandler('admin-edit-page-layout', { id: layout.pathname })}>
                    {layout.pathname}
                  </List.Content>
                </List.Item>
              ))
            }}
          </PageLayoutsQuery>
        </List>
      </AdminLayout>
    )
  }
}

export default withData(PageLayoutsPage)
