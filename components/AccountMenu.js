import React from 'react'
import { Menu } from 'semantic-ui-react'
import MenuLink from 'components/MenuLink'

export default function AccountMenu ({ session }) {
  return (
    <Menu vertical fluid>
      <MenuLink href='/account'>Account</MenuLink>
      {!session.hasAccount &&
        <MenuLink href='/register'>Register</MenuLink>
      }
      <MenuLink href='/account/email' disabled={!session.hasAccount}>Email</MenuLink>
      <MenuLink href='/account/password' disabled={!session.hasAccount}>Password</MenuLink>
    </Menu>
  )
}
