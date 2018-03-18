import React from 'react'
import withData from '../../lib/withData'
import withSession from '../../lib/withSession'
import AdminLayout from '../../components/AdminLayout'
import {
  Container
} from 'semantic-ui-react'

export class AdminPage extends React.Component {
  render() {
    return (
      <AdminLayout title='Admin' displayNavTitle>
      </AdminLayout>
    )
  }
}

export default withData(AdminPage)
