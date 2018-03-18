import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import {
  Container,
  Header,
  Message
} from 'semantic-ui-react'
import { Router } from 'routes'
import PlayerRegisterForm from 'components/PlayerRegisterForm'

export class register extends React.Component {
  async handleOnSubmit(e, { email, password, confirmPassword }) {
    const data = { email, password, confirmPassword }
    const response = await fetch(process.env.API_HOST + '/register',
      { method: 'POST'
      , body: JSON.stringify(data)
      , headers: new Headers({ 'Content-Type': 'application/json' })
      , credentials: 'include'
      })

    if (response.status !== 204) {
      const responseData = await response.json()

      throw new Error(responseData.error)
    }

    Router.replace('/')
  }

  handleSkip = (e) => {
    e.preventDefault()

    Router.replace('/')
  }

  render() {
    return (
      <DefaultLayout title='Register' displayNavTitle>
        <Container style={{ marginTop: '2em' }}>
          <Header>Register an account?</Header>
          <Message>
            <Message.Header>Benefits</Message.Header>
            <Message.List>
              <Message.Item>Quicker login</Message.Item>
              <Message.Item>Notifications (Coming Soon)</Message.Item>
              <Message.Item>Manage multiple player accounts (Coming Soon)</Message.Item>
            </Message.List>
          </Message>
          <PlayerRegisterForm onSubmit={this.handleOnSubmit} onSkip={this.handleSkip} />
        </Container>
      </DefaultLayout>
    )
  }
}

export default withData(register)
