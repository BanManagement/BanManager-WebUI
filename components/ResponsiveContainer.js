import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {
  Container,
  Icon,
  Menu,
  Responsive,
  Segment,
  Sidebar
} from 'semantic-ui-react'
import MenuLink from 'components/MenuLink'

const renderMenu = (items) => items.map(item => {
  if (React.isValidElement(item)) {
    return item
  } else {
    return <MenuLink key={item.id || item.name || item.icon} {...item} />
  }
})

class DesktopContainer extends Component {
  render () {
    const { children, getWidth, heading, leftItems, rightItems } = this.props
    const style = heading ? { minHeight: 500, padding: '1em 0em' } : { padding: 0 }

    return (
      <Responsive getWidth={getWidth} minWidth={Responsive.onlyTablet.minWidth} fireOnMount>
        <Segment
          inverted
          color='blue'
          textAlign='center'
          style={style}
          vertical
        >
          <Menu
            inverted
            pointing
            secondary
            borderless
            size='large'
            style={{ border: 0 }}
          >
            <Container>
              {renderMenu(leftItems)}
              <Menu.Item position='right' style={{ padding: 0 }}>
                {renderMenu(rightItems)}
              </Menu.Item>
            </Container>
          </Menu>
          { heading }
        </Segment>
        {children}
      </Responsive>
    )
  }
}

DesktopContainer.propTypes = {
  children: PropTypes.node,
  heading: PropTypes.node
}

class MobileContainer extends Component {
  state = {}

  handleSidebarHide = () => this.setState({ sidebarOpened: false })

  handleToggle = () => this.setState({ sidebarOpened: true })

  render () {
    const { children, getWidth, heading, leftItems, rightItems, displayNavTitle, title } = this.props
    const { sidebarOpened } = this.state
    const style = heading ? { minHeight: 350, padding: '1em 0em' } : { padding: 0 }

    return (
      <Responsive
        fireOnMount
        as={Sidebar.Pushable}
        getWidth={getWidth}
        maxWidth={Responsive.onlyMobile.maxWidth}
      >
        <Sidebar
          as={Menu}
          animation='push'
          inverted
          onHide={this.handleSidebarHide}
          vertical
          visible={sidebarOpened}
        >
          {renderMenu(leftItems)}
        </Sidebar>

        <Sidebar.Pusher dimmed={sidebarOpened}>
          <Segment
            color='blue'
            inverted
            textAlign='center'
            style={style}
            vertical
          >
            <Container>
              <Menu inverted pointing secondary size='large' style={{ border: 'none' }}>
                <Menu.Item onClick={this.handleToggle}>
                  <Icon name='sidebar' />
                </Menu.Item>
                {displayNavTitle &&
                  <Menu.Item>
                    {title}
                  </Menu.Item>
                }
                <Menu.Menu position='right'>
                  {renderMenu(rightItems)}
                </Menu.Menu>
              </Menu>
            </Container>
            {heading}
          </Segment>

          {children}
        </Sidebar.Pusher>
      </Responsive>
    )
  }
}

MobileContainer.propTypes = {
  children: PropTypes.node
}

const ResponsiveContainer = ({ children, getWidth, heading, mobile, leftItems, rightItems }) => (
  <div>
    <DesktopContainer getWidth={getWidth} heading={heading ? heading({}) : null} leftItems={leftItems} rightItems={rightItems}>{children}</DesktopContainer>
    <MobileContainer getWidth={getWidth} heading={heading ? heading({ mobile }) : null} leftItems={leftItems} rightItems={rightItems}>{children}</MobileContainer>
  </div>
)

ResponsiveContainer.propTypes = {
  children: PropTypes.node,
  heading: PropTypes.func,
  mobile: PropTypes.bool
}

export default ResponsiveContainer
