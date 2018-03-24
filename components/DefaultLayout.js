import React from 'react'
import PropTypes from 'prop-types'
import Head from 'next/head'
import { withRouter } from 'next/router'
import Alert from 'react-s-alert'
import { Container, Segment } from 'semantic-ui-react'
import Footer from './Footer'
import NavBar from './NavBar'
import NavigationQuery from './queries/NavigationQuery'
import SessionNavProfile from './SessionNavProfile'
import withSession from 'lib/withSession'

class DefaultLayout extends React.Component {
  static defaultProps =
    { title: 'Default Title'
    }
  static propTypes =
    { title: PropTypes.string
    , router: PropTypes.object.isRequired
    , displayNavTitle: PropTypes.bool
    , children: PropTypes.node.isRequired
    , session: PropTypes.object.isRequired
    , rightItems: PropTypes.node
    }

  render() {
    const { title, router: { pathname }, displayNavTitle, children, session } = this.props
    let { rightItems } = this.props

    if (!rightItems && !session.exists) {
      rightItems = [ { icon: 'user', href: '/login' } ]
    } else {
      rightItems = [ <SessionNavProfile key='session-nav-profile' session={session} /> ]
    }

    return (
      <div>
        <Head>
          <title>{ title }</title>
          <meta charSet='utf-8' />
          <meta name='viewport' content='initial-scale=1.0, width=device-width' />
          <meta name='author' content='BanManager-WebUI' />
          <link rel='stylesheet' href='//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.12/semantic.min.css' />
          <link rel='stylesheet' href='/static/css/s-alert-default.css' />
          <link rel='stylesheet' href='/static/css/react-datetime.css' />
        </Head>
        <Alert position='bottom' stack={false} timeout='none' />
        <NavigationQuery>
          {({ navigation: { left } }) => (
            <NavBar
              pathname={pathname}
              colour='blue'
              leftItems={left}
              rightItems={rightItems}
              title={title}
              displayNavTitle={displayNavTitle}
            >
              {children}
              <Segment
                inverted
                vertical
                style={{ margin: '5em 0em 0em', padding: '1em 0em', flex: 1 }}
              >
                <Container>
                  <Footer />
                </Container>
              </Segment>
            </NavBar>
          )}
        </NavigationQuery>

      </div>
    )
  }
}

export default withRouter(withSession(DefaultLayout))
