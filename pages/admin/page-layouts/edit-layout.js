import React from 'react'
import PropTypes from 'prop-types'
import withData from 'lib/withData'
import AdminLayout from 'components/AdminLayout'
import PageLayoutQuery from 'components/queries/PageLayoutQuery'
import { Router } from 'routes'
import gql from 'graphql-tag'
import { Mutation } from 'react-apollo'
import PageLayoutForm from 'components/PageLayoutForm'

const updatePageLayout = gql`
  mutation updatePageLayout($pathname: ID!, $input: UpdatePageLayoutInput!) {
    updatePageLayout(pathname: $pathname, input: $input) {
      pathname
    }
  }
`

export class EditPageLayoutPage extends React.Component {
  static propTypes = {
    data: PropTypes.object.isRequired
  }

  static async getInitialProps({ query }) {
    return {
      data: { id: query.id }
    }
  }

  onSubmit = (mutation) => {
    return async (e, pageLayout) => {
      // Clean up
      const deviceNames = Object.keys(pageLayout.devices)
      const input = {}

      deviceNames.forEach(device => {
        if (device === '__typename') return

        input[device] = pageLayout.devices[device].map(component => {
          return {
            id: component.id
          , component: component.component
          , x: component.x
          , y: component.y
          , w: component.w
          , textAlign: component.textAlign
          , colour: component.colour
          , meta: component.meta
          }
        })
      })

      await mutation({ variables: { pathname: this.props.data.id, input } })

      Router.pushRoute('admin-page-layouts')
    }
  }

  render() {
    const { data: { id } } = this.props
    const title = `Edit ${id} Layout`

    return (
      <PageLayoutQuery pathname={id}>
        {(data) => {
          return (
            <AdminLayout title={title} displayNavTitle>
              <Mutation mutation={updatePageLayout}>
                {(updatePageLayout, { error, loading }) => (
                  <PageLayoutForm
                    pageLayout={data.pageLayout}
                    pathname={data.variables.pathname}
                    onSubmit={this.onSubmit(updatePageLayout)}
                    error={error}
                    loading={loading}
                  />
                )}
              </Mutation>
            </AdminLayout>
          )
        }}
      </PageLayoutQuery>
    )
  }
}

export default withData(EditPageLayoutPage)
