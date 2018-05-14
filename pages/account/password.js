import React from 'react'
import gql from 'graphql-tag'
import { Mutation } from 'react-apollo'
import withData from 'lib/withData'
import withSession from 'lib/withSession'
import DefaultLayout from 'components/DefaultLayout'
import { Container, Grid, Message } from 'semantic-ui-react'
import AccountMenu from 'components/AccountMenu'
import PlayerPasswordForm from 'components/PlayerPasswordForm'

const setPassword = gql`
  mutation setPassword($currentPassword: String!, $newPassword: String!) {
    setPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      id
    }
  }
`

class AccountPasswordPage extends React.Component {
  state = { success: false }

  handleOnSubmit = (mutation) => {
    return async (e, { currentPassword, password }) => {
      this.setState({ success: false })

      await mutation({ variables: { currentPassword, newPassword: password } })

      this.setState({ success: true })
    }
  }

  render() {
    // @TODO Ensure logged in
    const { session } = this.props
    const { success } = this.state
    const title = `Settings for ${session.name}`

    return (
      <DefaultLayout title={title} displayNavTitle>
        <Container style={{ marginTop: '1em' }}>
          <Grid columns={2}>
            <Grid.Row>
              <Grid.Column width={4}>
                <AccountMenu session={session} />
              </Grid.Column>
              <Grid.Column width={12}>
                {success &&
                  <Message success header='Password successfully updated' />
                }
                <Mutation mutation={setPassword}>
                  {(setPassword) => (
                    <PlayerPasswordForm showCurrentPassword={session.type === 'password'} onSubmit={this.handleOnSubmit(setPassword)} />
                  )}
                </Mutation>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Container>
      </DefaultLayout>
    )
  }
}

export default withData(withSession(AccountPasswordPage))
