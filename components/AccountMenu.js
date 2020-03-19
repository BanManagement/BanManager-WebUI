import { Menu } from 'semantic-ui-react'
import MenuLink from './MenuLink'

export default function AccountMenu ({ user }) {
  return (
    <Menu vertical fluid>
      <MenuLink href='/account'>Account</MenuLink>
      {!user.hasAccount &&
        <MenuLink href='/register'>Register</MenuLink>}
      <MenuLink href='/account/email' disabled={!user.hasAccount}>Email</MenuLink>
      <MenuLink href='/account/password' disabled={!user.hasAccount}>Password</MenuLink>
    </Menu>
  )
}
