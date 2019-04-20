import React from 'react'
import withData from 'lib/withData'
import DefaultLayout from 'components/DefaultLayout'
import {
  Container,
  Header,
  Message
} from 'semantic-ui-react'
import { Router } from 'routes'
import PlayerPasswordForm from 'components/PlayerPasswordForm'
import ServersQuery from 'components/queries/ServersQuery'
import PlayerLoginPinForm from 'components/PlayerLoginPinForm'

export class PasswordSet extends React.Component {
  async handleOnSubmit (e, { password, confirmPassword }) {
    const data = { password, confirmPassword }
    const response = await fetch(process.env.API_HOST + '/session/password-set',
      { method: 'POST',
        body: JSON.stringify(data),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        credentials: 'include'
      })

    if (response.status !== 204) {
      const responseData = await response.json()

      throw new Error(responseData.error)
    }

    Router.replace('/')
  }

  render () {
    return (
      <DefaultLayout title='Login' displayNavTitle>
        <Container style={{ marginTop: '2em' }}>
          <Header>Register an account?</Header>
          <PlayerPasswordForm onSubmit={this.handleOnSubmit} />
          <Message
            info
            header='Banned?'
            content='Attempt to join the server in Minecraft, type in the pin number contained within your ban message'
          />
          <Message
            info
            header='Forgot password?'
            content='Join the server in Minecraft, type /bmpin in chat and type the generated pin number below'
          />
          <ServersQuery>
            {({ servers }) => (
              <PlayerLoginPinForm servers={servers} onSubmit={this.handleOnSubmit} />
            )}
          </ServersQuery>
        </Container>
      </DefaultLayout>
    )
  }
}

export default withData(PasswordSet)
