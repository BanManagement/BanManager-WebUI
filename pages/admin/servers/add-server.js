import React from 'react'
import PropTypes from 'prop-types'
import withData from '../../../lib/withData'
import AdminLayout from '../../../components/AdminLayout'
import { Router } from '../../../routes'
import ServerForm from '../../../components/ServerForm'
import ServerQuery from '../../../components/queries/ServerQuery'

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
    return Router.pushRoute('admin-servers')
  }

  render () {
    const { data: { id } } = this.props
    const title = 'Add Server'

    return (
      <AdminLayout title={title} displayNavTitle>
        <ServerQuery id={id} onUpdate={this.onUpdate}>
          {(data, { handleCreate }) => (
            <ServerForm data={data} onSubmit={handleCreate} />
          )}
        </ServerQuery>
      </AdminLayout>
    )
  }
}

export default withData(AddServerPage)
