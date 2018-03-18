import React from 'react'
import PropTypes from 'prop-types'
import withData from 'lib/withData'
import AdminLayout from 'components/AdminLayout'
import { Router } from 'routes'
import RoleForm from 'components/RoleForm'
import RoleQuery from 'components/queries/RoleQuery'

export class EditServerPage extends React.Component {
  static propTypes = {
    data: PropTypes.object.isRequired
  }

  static async getInitialProps({ query }) {
    return {
      data: { id: query.id }
    }
  }

  onUpdate = () => {
    return Router.pushRoute('admin-roles')
  }

  render() {
    const { data: { id } } = this.props
    const title = 'Edit Role'

    return (
      <AdminLayout title={title} displayNavTitle>
        <RoleQuery id={id} onUpdate={this.onUpdate}>
          {(data, { handleUpdate }) => (
            <RoleForm data={data} onSubmit={handleUpdate} />
          )}
        </RoleQuery>
      </AdminLayout>
    )
  }
}

export default withData(EditServerPage)
