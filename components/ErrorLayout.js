import React from 'react'
import Head from 'next/head'
import { withRouter } from 'next/router'
import { Grid, Message } from 'semantic-ui-react'
import NavBar from './NavBar'

const leftItems = [ { name: 'Home', href: '/' } ]

class ErrorLayout extends React.Component {
  render () {
    const { router: { pathname } } = this.props

    return (
      <React.Fragment>
        <Head>
          <title>Internal Server Error</title>
        </Head>
        <NavBar
          pathname={pathname}
          colour='blue'
          leftItems={leftItems}
        >
          <Grid
            textAlign='center'
            style={{ height: '100%' }}
            verticalAlign='middle'
          >
            <Grid.Column style={{ maxWidth: 450, marginTop: '15%' }}>
              <Message error>An Error Occured</Message>
            </Grid.Column>
          </Grid>
        </NavBar>
      </React.Fragment>
    )
  }
}

export default withRouter(ErrorLayout)
