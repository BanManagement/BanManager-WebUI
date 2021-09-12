import PropTypes from 'prop-types'
import { isValidElement, Component } from 'react'
import {
  Container,
  Icon,
  Menu,
  Segment,
  Sidebar,
  Visibility
} from 'semantic-ui-react'
import MenuLink from '../components/MenuLink'
import { Media, MediaContextProvider } from '../components/Media'

const renderMenu = (items = []) => items.map(item => {
  if (item.as === 'a') {
    return <a key={item.name} href={item.href}>{item.name}</a>
  } else if (isValidElement(item)) {
    return item
  } else {
    return <MenuLink key={item.name || item.icon} {...item} />
  }
})

class DesktopContainer extends Component {
  state = {}

  handleHideFixedMenu = () => this.setState({ fixed: false })
  handleShowFixedMenu = () => this.setState({ fixed: true })

  render () {
    const { children, heading, leftItems, rightItems } = this.props
    const { fixed } = this.state
    const style = heading ? { minHeight: 500, padding: '1em 0em', display: 'flex', flexDirection: 'column' } : {}

    return (
      <MediaContextProvider>
        <Media greaterThanOrEqual='tablet'>
          <Visibility
            once={false}
            onBottomPassed={this.handleShowFixedMenu}
            onBottomPassedReverse={this.handleHideFixedMenu}
          >
            <Segment
              inverted
              color='blue'
              textAlign='center'
              style={style}
              vertical
            >
              <Menu
                fixed={fixed ? 'top' : null}
                inverted={!fixed}
                secondary={!fixed}
                size='large'
                style={{ borderTop: 0 }}
              >
                <Container>
                  {renderMenu(leftItems)}
                  <Menu.Menu position='right' style={{ padding: 0 }}>
                    {renderMenu(rightItems)}
                  </Menu.Menu>
                </Container>
              </Menu>
              {heading}
            </Segment>
          </Visibility>

          {children}
        </Media>
      </MediaContextProvider>
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
    const { children, heading, leftItems, rightItems } = this.props
    const { sidebarOpened } = this.state
    const style = heading ? { minHeight: 350, padding: '1em 0em', display: 'flex', flexDirection: 'column' } : { padding: 0 }

    return (
      <MediaContextProvider>
        <Media at='mobile'>
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
                <Menu inverted secondary size='large' style={{ border: 'none' }}>
                  <Menu.Item onClick={this.handleToggle}>
                    <Icon name='sidebar' />
                  </Menu.Item>
                  <Menu.Menu position='right'>
                    {renderMenu(rightItems)}
                  </Menu.Menu>
                </Menu>
              </Container>
              {heading}
            </Segment>

            {children}
          </Sidebar.Pusher>
        </Media>
      </MediaContextProvider>
    )
  }
}

MobileContainer.propTypes = {
  children: PropTypes.node
}

const ResponsiveContainer = ({ children, heading, leftItems, rightItems }) => (
  <div>
    <DesktopContainer heading={heading ? heading({}) : null} leftItems={leftItems} rightItems={rightItems}>{children}</DesktopContainer>
    <MobileContainer heading={heading ? heading({ mobile: true }) : null} leftItems={leftItems} rightItems={rightItems}>{children}</MobileContainer>
  </div>
)

ResponsiveContainer.propTypes = {
  children: PropTypes.node,
  heading: PropTypes.func,
  mobile: PropTypes.bool
}

export default ResponsiveContainer
