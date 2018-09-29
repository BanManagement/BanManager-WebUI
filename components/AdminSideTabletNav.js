import React from 'react'
import PropTypes from 'prop-types'
import { Label, Menu } from 'semantic-ui-react'
import MenuLink from 'components/MenuLink'

export default class AdminSideTabletNav extends React.Component {
  static propTypes =
    { leftItems: PropTypes.array.isRequired
    }

  render() {
    const { leftItems } = this.props
    const items = leftItems.map(item => {
      if (item.label) {
        return <MenuLink key={item.name} name={item.name} href={item.href}><Label color='blue'>{item.label}</Label>{item.name}</MenuLink>
      }

      return <MenuLink key={item.name} name={item.name} href={item.href}>{item.name}</MenuLink>
    })

    return (
      <Menu vertical>
        {items}
      </Menu>
    )
  }
}
