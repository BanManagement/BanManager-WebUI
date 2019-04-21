import React from 'react'
import Head from 'next/head'
import { Grid, Message } from 'semantic-ui-react'
import DefaultLayout from 'components/DefaultLayout'
import PageContentContainer from 'components/PageContentContainer'

class ErrorLayout extends React.Component {
  render () {
    return (
      <React.Fragment>
        <Head>
          <title>Internal Server Error</title>
        </Head>
        <DefaultLayout>
          <PageContentContainer>
            <Grid
              textAlign='center'
              style={{ height: '100%' }}
              verticalAlign='middle'
            >
              <Grid.Column style={{ maxWidth: 450, marginTop: '25%' }}>
                <Message error>An Error Occured</Message>
              </Grid.Column>
            </Grid>
          </PageContentContainer>
        </DefaultLayout>
      </React.Fragment>
    )
  }
}

export default ErrorLayout
