import React from 'react'
import withData from 'lib/withData'
import withSession from 'lib/withSession'
import DefaultLayout from 'components/DefaultLayout'
import { Grid } from 'semantic-ui-react'
import AccountMenu from 'components/AccountMenu'
import PageContentContainer from 'components/PageContentContainer'
import { Router } from 'routes'

class AccountPage extends React.Component {
  render () {
    // @TODO Ensure logged in
    const { session } = this.props

    if (!session.exists) {
      Router.push('/login')
      return
    }

    const title = `Settings for ${session.name}`

    // @TODO Move the nav into a shared component
    return (
      <DefaultLayout title={title} displayNavTitle>
        <PageContentContainer>
          <Grid columns={2}>
            <Grid.Row>
              <Grid.Column width={4}>
                <AccountMenu session={session} />
              </Grid.Column>
              <Grid.Column width={12} />
            </Grid.Row>
          </Grid>
        </PageContentContainer>
      </DefaultLayout>
    )
  }
}

export default withData(withSession(AccountPage))
