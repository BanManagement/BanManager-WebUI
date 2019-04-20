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
import 'semantic-ui-css/semantic.min.css'
import 'react-s-alert/dist/s-alert-default.css'

class DefaultLayout extends React.Component {
  static defaultProps =
    { title: 'Default Title'
    }
  static propTypes =
    { title: PropTypes.string,
      router: PropTypes.object.isRequired,
      displayNavTitle: PropTypes.bool,
      children: PropTypes.node.isRequired,
      session: PropTypes.object.isRequired,
      rightItems: PropTypes.node
    }

  render () {
    const { title, router: { pathname }, displayNavTitle, children, session } = this.props
    let { rightItems } = this.props

    if (!rightItems && !session.exists) {
      rightItems = [ { icon: 'user', href: '/login' } ]
    } else {
      rightItems = [ <SessionNavProfile key='session-nav-profile' session={session} /> ]
    }

    return (
      <React.Fragment>
        <Head>
          <title>{ title }</title>
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
                style={{ marginLeft: '-1em', marginRight: '-1em', padding: '1em 0em', flex: 1 }}
              >
                <Container>
                  <Footer />
                </Container>
              </Segment>
            </NavBar>
          )}
        </NavigationQuery>
      </React.Fragment>
    )
  }
}

export default withRouter(withSession(DefaultLayout))
