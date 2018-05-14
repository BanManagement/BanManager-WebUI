import React from 'react'
import { Menu } from 'semantic-ui-react'
import MenuLink from 'components/MenuLink'

export default function AccountMenu({ session }) {
  return (
    <Menu vertical>
      <MenuLink href='/account'>Account</MenuLink>
      {!session.hasAccount &&
        <MenuLink href='/register'>Register</MenuLink>
      }
      <MenuLink disabled={!session.hasAccount}>Email</MenuLink>
      <MenuLink href='/account/password' disabled={!session.hasAccount}>Password</MenuLink>
    </Menu>
  )
}
