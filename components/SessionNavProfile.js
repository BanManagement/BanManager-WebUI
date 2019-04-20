import React from 'react'
import {
  Dropdown,
  Image,
  Menu
} from 'semantic-ui-react'
import { withApollo } from 'react-apollo'
import MenuLink from './MenuLink'
import { Router } from 'routes'

class SessionNavProfile extends React.Component {
  state = { loggingOut: false }

  handleLogout = async () => {
    this.setState({ loggingOut: true })

    // Using cookies for SSR instead of local storage, which are set to HttpOnly
    // requires server to delete cookie
    const response = await fetch(process.env.API_HOST + '/logout',
      { method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        credentials: 'include'
      })

    if (response.status !== 204) {
      this.setState({ loggingOut: false })

      const responseData = await response.json()

      throw new Error(responseData.error)
    }

    // Clear Apollo cache
    await this.props.client.cache.reset()

    Router.replace('/')
  }

  render () {
    const { session } = this.props
    const { loggingOut } = this.state

    return (
      <Dropdown
        item
        inline
        trigger={<Image fluid bordered centered rounded src={`https://crafatar.com/avatars/${session.id}?size=36&overlay=true`} />}
        icon={null}
      >
        <Dropdown.Menu>
          <MenuLink name={session.name} href={'/player/' + session.id} />
          <MenuLink name='Settings' href='/account' />
          <Menu.Item name='Logout' onClick={this.handleLogout} disabled={loggingOut} />
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}

export default withApollo(SessionNavProfile)
