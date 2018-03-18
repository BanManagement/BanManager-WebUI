import { Component } from 'react'
import {
  Button,
  Form,
  Segment
} from 'semantic-ui-react'
import GraphQLErrorMessage from './GraphQLErrorMessage'

class PlayerLoginPasswordForm extends Component {
  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  constructor(props) {
    super(props)

    this.state =
    { email: ''
    , password: ''
    , error: null
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

    return (
      <Form size='large' onSubmit={this.onSubmit} error loading={loading}>
        <Segment>
          <GraphQLErrorMessage error={error} />
          <Form.Input
            required
            name='email'
            placeholder='Email address'
            icon='user'
            iconPosition='left'
            onChange={this.handleChange}
          />
          <Form.Input
            required
            name='password'
            placeholder='Password'
            type='password'
            icon='lock'
            iconPosition='left'
            onChange={this.handleChange}
          />
          <Form.Button fluid primary size='large' content='Login' />
        </Segment>
      </Form>
    )
  }
}

export default PlayerLoginPasswordForm
