import React from 'react'
import {
  Form,
  Header,
  Segment,
  Select
} from 'semantic-ui-react'
import GraphQLErrorMessage from 'components/GraphQLErrorMessage'

class PlayerEditForm extends React.Component {
  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  handleServerRoleChange = (e, { name, value }) => {
    const newRoles = this.props.roles
      .filter(role => value.includes(role.id))
      .map(role => ({ role: { id: role.id, name: role.name }, server: { id: name } }))

    this.setState({ serverRoles: newRoles })
  }

  onSubmit = async (e) => {
    this.setState({ loading: true })

    const data = {
      serverRoles: this.state.serverRoles.map(role => ({ role: { id: role.role.id }, server: { id: role.server.id } })),
      roles: this.state.roles.map(id => ({ id }))
    }

    try {
      await this.props.onSubmit(e, this.props.player.id, data)
    } catch (error) {
      console.error(error)
      this.setState({ error, loading: false })
    }
  }

  constructor(props) {
    super(props)

    const { email, roles, serverRoles } = this.props.player

    this.state = { roles: roles.map(role => role.id), serverRoles, email: email || undefined }
  }

  render() {
    const servers = this.props.servers.map(server => ({ key: server.id, value: server.id, text: server.name }))
    const { email, roles, serverRoles, error, loading } = this.state
    const options = this.props.roles.map(role => ({ key: role.id, text: role.name, value: role.id }))

    return (
      <Form size='large' onSubmit={this.onSubmit} error loading={loading}>
        <Segment>
          <GraphQLErrorMessage error={error} />
          <Form.Input
            fluid
            placeholder='Email'
            value={email}
            name='email'
            readOnly
          />
          <Header>Global Roles</Header>
            <Select
              required
              name='roles'
              options={options}
              value={roles}
              placeholder='Role'
              onChange={this.handleChange}
              fluid
              multiple
            />
            <Header>Server Roles</Header>
            {servers.map(server => {
              const value = serverRoles
                .filter(r => r.server.id === server.value)
                .map(({ role }) => role.id)

              return (
                <React.Fragment key={server.value}>
                  <Header size='small'>{server.text}</Header>
                  <Select
                    required
                    name={server.value}
                    options={options}
                    value={value}
                    placeholder='Role'
                    onChange={this.handleServerRoleChange}
                    fluid
                    multiple
                  />
                </React.Fragment>
              )
            })}
          <Form.Button fluid primary size='large' content='Save' />
        </Segment>
      </Form>
    )
  }
}

export default PlayerEditForm
