import React from 'react'
import gql from 'graphql-tag'
import { compose, graphql } from 'react-apollo'
import {
  Loader
} from 'semantic-ui-react'
import GraphQlErrorMessage from '../GraphQLErrorMessage'

const createQuery = gql`
  query parentRoles {
    roles(defaultOnly: true) {
      id
      name
    }
    resources {
      id
      name
      permissions {
        id
        name
        allowed
      }
    }
  }
`

const editQuery = gql`
  query role($id: ID!) {
    role(id: $id) {
      id
      name
      parent
      resources {
        id
        name
        permissions {
          id
          name
          allowed
        }
      }
    }
    roles(defaultOnly: true) {
      id
      name
    }
  }
`

const createMutation = gql`
  mutation createRole($input: UpdateRoleInput!) {
    createRole(input: $input) {
      id
    }
  }
`

const editMutation = gql`
  mutation updateRole($id: ID!, $input: UpdateRoleInput!) {
    updateRole(id: $id, input: $input) {
      id
    }
  }
`

class RoleQuery extends React.Component {
  handleUpdate = async (e, { id, name, parent, resources }) => {
    e.preventDefault()

    await this.props.UpdateRoleMutation({ editMutation, variables: { id, input: { name, parent, resources } }, refetchQueries: [ 'roles' ] })

    return this.props.onUpdate()
  }

  handleCreate = async (e, { name, parent, resources }) => {
    e.preventDefault()

    await this.props.CreateRoleMutation({ createMutation, variables: { input: { name, parent, resources } }, refetchQueries: [ 'roles' ] })

    return this.props.onUpdate()
  }

  render () {
    if (this.props.data && this.props.data.error) return <GraphQlErrorMessage error={this.props.data.error} />
    if (this.props.data && !(this.props.data.roles || this.props.data.role)) return <Loader active />

    return this.props.children(this.props.data, { handleCreate: this.handleCreate, handleUpdate: this.handleUpdate })
  }
}

export default compose(
  graphql(createQuery, { skip: ({ id }) => !!id })
  , graphql(createMutation, { name: 'CreateRoleMutation' })
  , graphql(editMutation, { name: 'UpdateRoleMutation' })
  , graphql(editQuery,
    { options: ({ id }) => ({ variables: { id } }),
      skip: ({ id }) => !id
    })
)(RoleQuery)
