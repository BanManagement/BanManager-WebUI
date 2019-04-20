import React from 'react'
import PropTypes from 'prop-types'
import withData from 'lib/withData'
import AdminLayout from 'components/AdminLayout'
import { Router } from 'routes'
import RoleForm from 'components/RoleForm'
import RoleQuery from 'components/queries/RoleQuery'

export class AddServerPage extends React.Component {
  static propTypes = {
    data: PropTypes.object.isRequired
  }

  static async getInitialProps ({ query }) {
    return {
      data: { id: query.id }
    }
  }

  onUpdate = () => {
    return Router.pushRoute('admin-roles')
  }

  render () {
    const { data: { id } } = this.props
    const title = 'Add Role'

    return (
      <AdminLayout title={title} displayNavTitle>
        <RoleQuery id={id} onUpdate={this.onUpdate}>
          {(data, { handleCreate }) => (
            <RoleForm data={data} onSubmit={handleCreate} />
          )}
        </RoleQuery>
      </AdminLayout>
    )
  }
}

export default withData(AddServerPage)
