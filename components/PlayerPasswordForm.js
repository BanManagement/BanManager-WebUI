import React from 'react'
import {
  Form,
  Segment,
  Select
} from 'semantic-ui-react'
import ErrorMessage from './ErrorMessage'

class PlayerPasswordForm extends React.Component {
  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  constructor(props) {
    super(props)

    this.state =
    { password: ''
    , confirmPassword: ''
    , error: null
    , loading: false
    }
  }

  onSubmit = async (e) => {
    if (this.state.password !== this.state.confirmPassword) {
      return this.setState({ error: new Error('Passwords do not match') })
    }

    this.setState({ error: null, loading: true })

    try {
      await this.props.onSubmit(e, this.state)
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  render() {
    const { error, loading } = this.state

    return (
      <Form size='large' onSubmit={this.onSubmit} error loading={loading}>
        <Segment>
          <ErrorMessage error={error} />
          <Form.Input
            required
            name='password'
            placeholder='Password'
            type='password'
            icon='lock'
            iconPosition='left'
            onChange={this.handleChange}
          />
          <Form.Input
            required
            name='confirmPassword'
            placeholder='Confirm Password'
            type='password'
            icon='lock'
            iconPosition='left'
            onChange={this.handleChange}
          />
          <Form.Button fluid primary size='large' content='Set Password' />
        </Segment>
      </Form>
    )
  }
}

export default PlayerPasswordForm
