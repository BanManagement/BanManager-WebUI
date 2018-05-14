import React from 'react'
import {
  Form,
  Segment
} from 'semantic-ui-react'
import GraphQLErrorMessage from './GraphQLErrorMessage'

class PlayerPasswordForm extends React.Component {
  static defaultProps = { showCurrentPassword: false }

  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  constructor(props) {
    super(props)

    this.state =
    { password: ''
    , confirmPassword: ''
    , currentPassword: ''
    , error: null
    , loading: false
    }
  }

  onSubmit = async (e) => {
    if (this.state.password !== this.state.confirmPassword) {
      return this.setState({ error: new Error('Passwords do not match') })
    }

    if (this.props.showCurrentPassword && !this.state.currentPassword) {
      return this.setState({ error: new Error('Please provide your current password') })
    }

    this.setState({ error: null, loading: true })

    try {
      await this.props.onSubmit(e, this.state)
    } catch (error) {
      this.setState({ error })
    }

    this.setState({ loading: false })
  }

  render() {
    const { showCurrentPassword } = this.props
    const { error, loading } = this.state

    return (
      <Form size='large' onSubmit={this.onSubmit} error loading={loading}>
        <Segment>
          <GraphQLErrorMessage error={error} />
          { showCurrentPassword &&
            <Form.Input
              required
              name='currentPassword'
              placeholder='Current Password'
              type='password'
              icon='lock'
              iconPosition='left'
              onChange={this.handleChange}
            />
          }
          <Form.Input
            required
            name='password'
            placeholder='New Password'
            type='password'
            icon='lock'
            iconPosition='left'
            onChange={this.handleChange}
          />
          <Form.Input
            required
            name='confirmPassword'
            placeholder='Confirm New Password'
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
