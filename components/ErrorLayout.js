import React from 'react'
import Head from 'next/head'
import { withRouter } from 'next/router'
import { Grid, Message } from 'semantic-ui-react'
import NavBar from './NavBar'

const leftItems = [ { name: 'Home', href: '/' } ]

class ErrorLayout extends React.Component {

  render() {
    const { router: { pathname } } = this.props

    return (
      <React.Fragment>
        <Head>
          <title>Internal Server Error</title>
          <meta charSet='utf-8' />
          <meta name='viewport' content='initial-scale=1.0, width=device-width' />
          <meta name='author' content='BanManager-WebUI' />
          <link rel='stylesheet' href='//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.12/semantic.min.css' />
          <link rel='stylesheet' href='/static/css/s-alert-default.css' />
          <link rel='stylesheet' href='/static/css/react-datetime.css' />
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
