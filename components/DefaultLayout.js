import React from 'react'
import PropTypes from 'prop-types'
import Head from 'next/head'
import Alert from 'react-s-alert'
import Footer from './Footer'
import ResponsiveContainer from 'components/ResponsiveContainer'
import NavigationQuery from './queries/NavigationQuery'
import SessionNavProfile from './SessionNavProfile'
import withSession from 'lib/withSession'
import getWidthFactory from 'lib/widthFactory'
import GlobalContext from 'lib/GlobalContext'
import 'semantic-ui-css/semantic.min.css'
import 'react-s-alert/dist/s-alert-default.css'

class DefaultLayout extends React.Component {
  static defaultProps =
    { title: 'Default Title'
    }
  static propTypes =
    { title: PropTypes.string,
      displayNavTitle: PropTypes.bool,
      children: PropTypes.node.isRequired,
      heading: PropTypes.func,
      session: PropTypes.object.isRequired,
      rightItems: PropTypes.node
    }

  render () {
    const { title, displayNavTitle, children, session, heading } = this.props
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
        <GlobalContext.Consumer>
          {({ isMobileFromSSR }) =>
            <NavigationQuery>
              {({ navigation: { left } }) => (
                <ResponsiveContainer heading={heading} leftItems={left} rightItems={rightItems} getWidth={getWidthFactory(isMobileFromSSR)} mobile={isMobileFromSSR} displayNavTitle={displayNavTitle} title={title}>
                  {children}
                  <Footer getWidth={getWidthFactory(isMobileFromSSR)} />
                </ResponsiveContainer>
              )}
            </NavigationQuery>
          }
        </GlobalContext.Consumer>
      </React.Fragment>
    )
  }
}

export default withSession(DefaultLayout)
