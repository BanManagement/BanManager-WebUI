import React from 'react'
import Alert from 'react-s-alert'
import { Router } from 'routes'
import {
  Button,
  Confirm,
  List
} from 'semantic-ui-react'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

const deleteMutation = gql`
  mutation deleteRole($id: ID!) {
    deleteRole(id: $id) {
      id
    }
  }
`

class RoleItem extends React.Component {
  state = { deleteConfirmShow: false, deleting: false }

  clickRouteHandler = (route, params) => () => Router.pushRoute(route, params)
  showConfirmDelete = () => this.setState({ deleteConfirmShow: true })
  handleConfirmDelete = async () => {
    this.setState({ deleteConfirmShow: false })

    const { id } = this.props

    this.setState({ deleting: true })

    try {
      await this.props.mutate(
        { variables: { id }
        , refetchQueries: [ 'roles' ]
        })
    } catch (e) {
      Alert.error('An error occurred')
    } finally {
      this.setState({ deleting: false })
    }
  }
  handleDeleteCancel = () => this.setState({ deleteConfirmShow: false })

  render() {
    const { id, name } = this.props

    return (
      <List.Item>
        <Confirm
          open={this.state.deleteConfirmShow}
          onConfirm={this.handleConfirmDelete}
          onCancel={this.handleDeleteCancel}
        />
        { id > 3 &&
          <List.Content floated='right'>
            <Button color='red' icon='trash' loading={this.state.deleting} disabled={this.state.deleting} onClick={this.showConfirmDelete} />
          </List.Content>
        }
        <List.Content onClick={this.clickRouteHandler('admin-edit-role', { id })}>
          {name}
        </List.Content>
      </List.Item>
    )
  }
}

export default graphql(deleteMutation)(RoleItem)
