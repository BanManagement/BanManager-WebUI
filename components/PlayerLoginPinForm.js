import React from 'react'
import {
  Form,
  Segment,
  Select
} from 'semantic-ui-react'
import ErrorMessage from './ErrorMessage'

class PlayerLoginPinForm extends React.Component {
  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  constructor(props) {
    super(props)

    this.state =
    { name: ''
    , pin: ''
    , error: null
    , server: props.servers && props.servers.length ? props.servers[0].id : null
    , loading: false
    }
  }

  onSubmit = async (e) => {
    this.setState({ loading: true })

    try {
      await this.props.onSubmit(e, this.state)
    } catch (error) {
      this.setState({ error })
    }

    this.setState({ loading: false })
  }

  render() {
    const { error, loading } = this.state
    const servers = this.props.servers.map(server => ({ key: server.id, value: server.id, text: server.name }))

    return (
      <Form size='large' onSubmit={this.onSubmit} error loading={loading}>
        <Segment>
          <ErrorMessage error={error} />
          <Form.Field
            required
            name='server'
            control={Select}
            options={servers}
            placeholder='Server'
            onChange={this.handleChange}
            defaultValue={servers.length ? servers[0].value : null}
          />
          <Form.Input
            required
            name='name'
            placeholder='Player name'
            icon='user'
            iconPosition='left'
            onChange={this.handleChange}
          />
          <Form.Input
            required
            name='pin'
            placeholder='Pin'
            type='password'
            icon='lock'
            iconPosition='left'
            onChange={this.handleChange}
          />
          <Form.Button fluid primary size='large' content='Join' />
        </Segment>
      </Form>
    )
  }
}

export default PlayerLoginPinForm
