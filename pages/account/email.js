import React from 'react'
import withData from 'lib/withData'
import withSession from 'lib/withSession'
import DefaultLayout from 'components/DefaultLayout'
import { Form, Grid, Message, Segment } from 'semantic-ui-react'
import gql from 'graphql-tag'
import { Mutation } from 'react-apollo'
import AccountMenu from 'components/AccountMenu'
import GraphQLErrorMessage from 'components/GraphQLErrorMessage'
import PageContentContainer from 'components/PageContentContainer'

const setEmail = gql`
  mutation setEmail($currentPassword: String!, $email: String!) {
    setEmail(currentPassword: $currentPassword, email: $email) {
      id
    }
  }
`

class AccountEmailPage extends React.Component {
  state = { success: false }

  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  onSubmit = (mutation) => {
    return async () => {
     this.setState({ success: false })

      await mutation({ variables: { currentPassword: this.state.currentPassword, email: this.state.email } })

      this.setState({ success: true })
    }
  }

  render() {
    // @TODO Ensure logged in
    const { session } = this.props
    const { success } = this.state
    const title = 'Settings'

    return (
      <DefaultLayout title={title} displayNavTitle>
        <PageContentContainer>
          <Grid columns={2} stackable>
            <Grid.Row>
              <Grid.Column width={4}>
                <AccountMenu session={session} />
              </Grid.Column>
              <Grid.Column width={12}>
                {success &&
                  <Message success header='Email successfully updated' />
                }
                <Mutation mutation={setEmail}>
                  {(setEmail, { error, loading }) => (
                    <Form size='large' onSubmit={this.onSubmit(setEmail)} error loading={loading}>
                      <Segment>
                        <GraphQLErrorMessage error={error} />
                        <Form.Input
                          required
                          name='email'
                          placeholder='New Email Address'
                          type='text'
                          icon='mail'
                          iconPosition='left'
                          onChange={this.handleChange}
                        />
                        <Form.Input
                          required
                          name='currentPassword'
                          placeholder='Current Password'
                          type='password'
                          icon='lock'
                          iconPosition='left'
                          onChange={this.handleChange}
                        />
                        <Form.Button fluid primary size='large' content='Save' />
                      </Segment>
                    </Form>
                  )}
                </Mutation>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </PageContentContainer>
      </DefaultLayout>
    )
  }
}

export default withData(withSession(AccountEmailPage))
