import { withRouter } from 'next/router'
import { Menu } from 'semantic-ui-react'

const MenuLink = ({ children, router, name, href, icon, disabled }) => {
  const handleClick = (e) => {
    if (e.button !== 0 || !href) return // Allow middle clicks to open in new tab
    e.preventDefault()

    router.push(href)
  }

  return (
    <Menu.Item
      as='a'
      name={name}
      active={router.pathname === href}
      href={href}
      onClick={handleClick}
      icon={icon}
      disabled={disabled}
    >
      {children}
    </Menu.Item>
  )
}

export default withRouter(MenuLink)
