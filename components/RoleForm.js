import React from 'react'
import { cloneDeep, find } from 'lodash-es'
import {
  Form,
  Header,
  Segment,
  Select
} from 'semantic-ui-react'
import GraphQLErrorMessage from './GraphQLErrorMessage'

class RoleForm extends React.Component {
  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  handlePermissionChange = (e, { name, checked, value }) => {
    // @TODO Better way to do this? React doesn't seem to like deeply nested structures...
    const resources = cloneDeep(this.state.resources)
    const resource = find(resources, { name: name.replace('[]', '') })
    const permission = find(resource.permissions, { name: value })

    permission.allowed = checked

    this.setState({ resources })
  }

  constructor (props) {
    super(props)

    const { data: { role } } = props
    let { id, name, parent, resources } = role || {}

    if (resources && id === 3) {
      resources = []
    } else if (!resources) {
      resources = props.data.resources
    }

    // @TODO Must be a better way...
    resources = resources.map(resource => {
      resource = Object.assign({}, resource)

      delete resource.__typename

      resource.permissions = resource.permissions.map(perm => {
        perm = Object.assign({}, perm)

        delete perm.__typename

        return perm
      })

      return resource
    })

    const roles = this.props.data.roles
      .map(role => ({ key: role.id, value: role.id, text: role.name }))

    if (!parent && !id) {
      parent = roles[0].value
    }

    this.state =
    { id,
      name: name || '',
      resources,
      parent,
      error: null,
      loading: false,
      roles
    }
  }

  onSubmit = async (e) => {
    this.setState({ loading: true })

    try {
      await this.props.onSubmit(e, this.state)
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  renderPermissions = (resource) => {
    return resource.permissions.map(permission => (
      <Form.Checkbox
        key={`resource-${resource.name}-${permission.name}`}
        defaultChecked={permission.allowed}
        name={`${resource.name}[]`}
        value={permission.name}
        label={permission.name}
        onChange={this.handlePermissionChange}
      />
    ))
  }

  render () {
    const { id, name, resources, parent, roles, error, loading } = this.state
    let resourceInputs = []

    if (resources.length) {
      resourceInputs = resources.map(resource => (
        <React.Fragment key={resource.name}>
          <Header>{resource.name}</Header>
          {this.renderPermissions(resource)}
        </React.Fragment>
      ))
    }

    console.log(resourceInputs)

    return (
      <Form size='large' onSubmit={this.onSubmit} error loading={loading}>
        <Segment>
          <GraphQLErrorMessage error={error} />
          <Form.Input
            fluid
            required
            placeholder='Name'
            value={name}
            name='name'
            onChange={this.handleChange}
          />
          {(!id || id > 3) &&
            <Form.Field
              required
              name='parent'
              control={Select}
              options={roles}
              placeholder='Parent Role'
              onChange={this.handleChange}
              defaultValue={parent}
            />
          }
          <Header>Resources</Header>
          {id === '3' &&
            <p>{name} has access to all resources</p>
          }
          {(!id || id !== '3') && resourceInputs}
          <Form.Button fluid primary size='large' content='Save' />
        </Segment>
      </Form>
    )
  }
}

export default RoleForm
