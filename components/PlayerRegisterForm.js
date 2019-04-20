import React from 'react'
import {
  Button,
  Form,
  Segment
} from 'semantic-ui-react'
import ErrorMessage from './ErrorMessage'

class PlayerRegisterForm extends React.Component {
  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  constructor (props) {
    super(props)

    this.state =
    { email: '',
      password: '',
      confirmPassword: '',
      error: null,
      loading: false
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

  render () {
    const { error, loading } = this.state

    return (
      <Segment>
        <Form size='large' onSubmit={this.onSubmit} error loading={loading}>
          <ErrorMessage error={error} />
          <Form.Input
            required
            name='email'
            placeholder='Email Address'
            type='text'
            icon='mail'
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
          <Form.Input
            required
            name='confirmPassword'
            placeholder='Confirm Password'
            type='password'
            icon='lock'
            iconPosition='left'
            onChange={this.handleChange}
          />
          <Form.Button fluid primary size='large' content='Confirm' />
        </Form>
        <Button fluid size='large' content='Skip' onClick={this.props.onSkip} />
      </Segment>
    )
  }
}

export default PlayerRegisterForm
