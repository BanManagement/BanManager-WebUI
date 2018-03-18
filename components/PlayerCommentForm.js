import React from 'react'
import PlayerReportComment from './PlayerReportComment'
import {
  Button,
  Form
} from 'semantic-ui-react'
import GraphQLErrorMessage from 'components/GraphQLErrorMessage'

class PlayerCommentForm extends React.Component {
  state = { error: null, loading: false, message: '' }

  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  onSubmit = async (e) => {
    this.setState({ loading: true })

    try {
      await this.props.onSubmit(e, this.state)
    } catch (error) {
      console.error(error)
      this.setState({ error })
    }

    this.setState({ loading: false, message: '' })
  }

  render() {
    const { error, loading } = this.props

    return (
      <Form onSubmit={this.onSubmit} error loading={loading}>
        <GraphQLErrorMessage error={error} />
        <Form.TextArea name='message' maxLength='250' value={this.state.message} onChange={this.handleChange} />
        <Form.Button content='Reply' labelPosition='left' icon='edit' primary />
      </Form>
    )
  }
}

export default PlayerCommentForm
