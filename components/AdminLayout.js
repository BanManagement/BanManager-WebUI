import React from 'react'
import PropTypes from 'prop-types'
import Head from 'next/head'
import { withRouter } from 'next/router'
import Alert from 'react-s-alert'
import AdminNavBar from './AdminNavBar'
import AdminNavigationQuery from './queries/AdminNavigationQuery'
import SessionNavProfile from './SessionNavProfile'
import withSession from '../lib/withSession'

class AdminLayout extends React.Component {
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
          <link rel='stylesheet' href='//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.12/semantic.min.css' />
          <link rel='stylesheet' href='/static/css/s-alert-default.css' />
        </Head>
        <Alert position='bottom' stack={false} timeout='none' />
        <AdminNavigationQuery>
          {({ navigation: { left: top }, adminNavigation: { left } }) => (
            <AdminNavBar
              pathname={pathname}
              colour='blue'
              topItems={top}
              leftItems={left}
              rightItems={rightItems}
              title={title}
              displayNavTitle={displayNavTitle}
            >
              {children}
            </AdminNavBar>
          )}
        </AdminNavigationQuery>
      </div>
    )
  }
}

export default withRouter(withSession(AdminLayout))
