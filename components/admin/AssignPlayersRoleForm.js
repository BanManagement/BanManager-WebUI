import React from 'react'
import { withApollo } from 'react-apollo'
import { Form, Grid, Select } from 'semantic-ui-react'
import RolesQuery from 'components/queries/RolesQuery'
import PlayerSelector from './PlayerSelector'
import GraphQLErrorMessage from 'components/GraphQLErrorMessage'

class AssignPlayersRoleForm extends React.Component {
  static defaultProps = { servers: [] }
  state = { loading: false, error: null }

  handlePlayerChange = (value) => {
    this.setState({ players: value })
  }

  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  onSubmit = async () => {
    const { players, role } = this.state

    this.setState({ loading: true, error: null })

    const variables = { players, role: parseInt(role, 10) }

    if (this.props.servers.length) {
      variables.serverId = this.state.server
    }

    try {
      await this.props.client.mutate({ mutation: this.props.mutation, variables })
    } catch (error) {
      this.setState({ error })
    }

    this.setState({ loading: false, players: [] })
  }

  render() {
    const { error, loading } = this.state
    const servers = this.props.servers.map(server => ({ key: server.id, value: server.id, text: server.name }))

    return (
      <Grid doubling>
        <Grid.Row>
          <Grid.Column width={4} mobile={16}>
            <GraphQLErrorMessage error={error} />
            <PlayerSelector handleChange={this.handlePlayerChange} />
          </Grid.Column>
          <Grid.Column width={4} mobile={16}>
            <RolesQuery>
              {({ roles }) => {
                const data = roles.map(role => ({ key: role.id, text: role.name, value: role.id }))

                return (
                  <Form.Field
                    required
                    name='role'
                    control={Select}
                    options={data}
                    placeholder='Role'
                    onChange={this.handleChange}
                    fluid
                  />
                )
              }}
            </RolesQuery>
          </Grid.Column>
          {!!servers.length &&
            <Grid.Column width={4} mobile={16}>
              <Form.Field
                required
                name='server'
                control={Select}
                options={servers}
                placeholder='Server'
                onChange={this.handleChange}
                defaultValue={servers.length ? servers[0].value : null}
                fluid
              />
            </Grid.Column>
          }
          <Grid.Column width={2} mobile={6}>
            <Form.Button
              loading={loading}
              disabled={loading}
              fluid
              primary
              size='large'
              content='Add'
              onClick={this.onSubmit}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }
}

export default withApollo(AssignPlayersRoleForm)
