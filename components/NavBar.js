import {
  Container,
  Icon,
  Menu,
  Segment,
  Sidebar,
  Responsive
} from 'semantic-ui-react'
import React from 'react'
import PropTypes from 'prop-types'
import MenuLink from './MenuLink'

const NavBarMobile = ({
  children,
  colour,
  displayNavTitle,
  leftItems,
  onPusherClick,
  onToggle,
  rightItems,
  title,
  visible
}) => (
  <Sidebar.Pushable>
    <Sidebar
      as={Menu}
      animation="overlay"
      icon="labeled"
      inverted
      items={leftItems.map(item => <MenuLink {...item} key={item.id || item.name || item.icon} />)}
      vertical
      visible={visible}
    />
    <Sidebar.Pusher
      dimmed={visible}
      onClick={onPusherClick}
      style={{ minHeight: '100vh', paddingTop: '2em' }}
    >
      <Menu
        fixed='top'
        borderless
        inverted
        color={colour}
        style={{ borderRadius: 0 }}
        size='large'
      >
        <Menu.Item onClick={onToggle}>
          <Icon name='sidebar' />
        </Menu.Item>
        {displayNavTitle &&
          <Menu.Item>
            {title}
          </Menu.Item>
        }
        <Menu.Menu position='right'>
          {rightItems.map(item => React.isValidElement(item) ? item : <MenuLink {...item} key={item.id || item.name || item.icon} />)}
        </Menu.Menu>
      </Menu>
      {children}
    </Sidebar.Pusher>
  </Sidebar.Pushable>
)

NavBarMobile.propTypes =
{ children: PropTypes.node.isRequired
, colour: PropTypes.string
, displayNavTitle: PropTypes.bool
, leftItems: PropTypes.array.isRequired
, rightItems: PropTypes.array.isRequired
, onPusherClick: PropTypes.func.isRequired
, onToggle: PropTypes.func.isRequired
, title: PropTypes.string
, visible: PropTypes.bool
}

const NavBarDesktop = ({ colour, leftItems, rightItems }) => (
  <Segment inverted color={colour} vertical>
    <Container>
      <Menu
        inverted
        borderless
        color={colour}
        style={{ marginBottom: 0, borderRadius: 0 }}
        size='large'
      >
        {leftItems.map(item => <MenuLink {...item} key={item.id || item.name || item.icon} />)}
        <Menu.Menu position='right'>
          {rightItems.map(item => React.isValidElement(item) ? item : <MenuLink {...item} key={item.id || item.name || item.icon} />)}
        </Menu.Menu>
      </Menu>
    </Container>
  </Segment>
)

NavBarDesktop.propTypes =
{ colour: PropTypes.string
, leftItems: PropTypes.array
, rightItems: PropTypes.array
}

const NavBarChildren = ({ children }) => (
  <Container fluid style={{display:"flex", minHeight:"100vh", flexDirection:"column"}}>{children}</Container>
)

NavBarChildren.propTypes = {
  children: PropTypes.node.isRequired
}

export default class NavBar extends React.Component {
  state = {
    visible: false
  }
  static defaultProps = { leftItems: [], rightItems: [], colour: 'blue' }
  static propTypes =
  { leftItems: PropTypes.array
  , rightItems: PropTypes.array
  , children: PropTypes.node
  }

  handlePusher = () => {
    const { visible } = this.state

    if (visible) this.setState({ visible: false })
  }

  handleToggle = () => this.setState({ visible: !this.state.visible })

  render() {
    const { children } = this.props
    const { visible } = this.state

    return (
      <React.Fragment>
        <Responsive {...Responsive.onlyMobile}>
          <NavBarMobile
            onPusherClick={this.handlePusher}
            onToggle={this.handleToggle}
            visible={visible}
            {...this.props}
          >
            <NavBarChildren>{children}</NavBarChildren>
          </NavBarMobile>
        </Responsive>
        <Responsive minWidth={Responsive.onlyTablet.minWidth}>
          <NavBarDesktop {...this.props} />
          <NavBarChildren {...this.props}>{children}</NavBarChildren>
        </Responsive>
      </React.Fragment>
    )
  }
}
