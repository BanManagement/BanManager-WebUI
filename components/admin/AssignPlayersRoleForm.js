import React from 'react'
import gql from 'graphql-tag'
import { withApollo } from 'react-apollo'
import { Form, Grid, Select } from 'semantic-ui-react'
import RolesQuery from 'components/queries/RolesQuery'
import PlayerSelector from './PlayerSelector'
import GraphQLErrorMessage from 'components/GraphQLErrorMessage'

class AssignPlayersRoleForm extends React.Component {
  state = { loading: false, error: null }

  handlePlayerChange = (value) => {
    this.setState({ players: value })
  }

  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  onSubmit = async () => {
    const { players, role } = this.state

    this.setState({ loading: true, error: null })

    try {
      await this.props.client.mutate({ mutation, variables: { players, role: parseInt(role, 10) } })
    } catch (error) {
      this.setState({ error })
    }

    this.setState({ loading: false, players: [] })
  }

  render() {
    const { error, loading } = this.state

    return (
      <Grid>
        <Grid.Row columns={3}>
          <Grid.Column width={10}>
            <GraphQLErrorMessage error={error} />
            <PlayerSelector handleChange={this.handlePlayerChange} />
          </Grid.Column>
          <Grid.Column width={4}>
            <RolesQuery>
              {({ roles }) => {
                const data = roles.map(role => ({ key: role.id, text: role.name, value: role.id } ))

                return (
                  <Form.Field
                    required
                    name='role'
                    control={Select}
                    options={data}
                    placeholder='Role'
                    onChange={this.handleChange}
                  />
                )
              }}
            </RolesQuery>
          </Grid.Column>
          <Grid.Column width={2}>
            <Form.Button loading={loading} disabled={loading} fluid primary size='large' content='Add' onClick={this.onSubmit} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }
}

export default withApollo(AssignPlayersRoleForm)

export const mutation = gql`
  mutation assignRole($players: [UUID!], $role: Int!) {
    assignRole(players: $players, role: $role) {
      id
    }
  }
`
