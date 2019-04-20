import {
  Container,
  Grid,
  Header,
  Icon,
  Menu,
  Segment,
  Sidebar,
  Responsive
} from 'semantic-ui-react'
import React from 'react'
import PropTypes from 'prop-types'
import MenuLink from './MenuLink'
import AdminSideTabletNav from './AdminSideTabletNav'

const AdminNavBarMobile = ({
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
      animation='overlay'
      icon='labeled'
      inverted
      vertical
      visible={visible}
    >
      {leftItems.map(item => <MenuLink {...item} key={item.id || item.name || item.icon} />)}
    </Sidebar>
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

AdminNavBarMobile.propTypes =
{ children: PropTypes.node.isRequired,
  colour: PropTypes.string,
  displayNavTitle: PropTypes.bool,
  leftItems: PropTypes.array.isRequired,
  rightItems: PropTypes.array.isRequired,
  onPusherClick: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  title: PropTypes.string,
  visible: PropTypes.bool
}

const AdminNavBarDesktop = ({ colour, topItems, rightItems }) => (
  <Segment inverted color={colour} vertical>
    <Container>
      <Menu
        inverted
        borderless
        color={colour}
        style={{ marginBottom: 0, borderRadius: 0 }}
        size='large'
      >
        {topItems.map(item => <MenuLink {...item} key={item.id || item.name || item.icon} />)}
        <Menu.Menu position='right'>
          {rightItems.map(item => React.isValidElement(item) ? item : <MenuLink {...item} key={item.id || item.name || item.icon} />)}
        </Menu.Menu>
      </Menu>
    </Container>
  </Segment>
)

AdminNavBarDesktop.propTypes =
{ colour: PropTypes.string,
  topItems: PropTypes.array,
  rightItems: PropTypes.array
}

const AdminNavBarChildren = ({ children }) => (
  <Container fluid>{children}</Container>
)

AdminNavBarChildren.propTypes = {
  children: PropTypes.node.isRequired
}

export default class AdminNavBar extends React.Component {
  state = {
    visible: false
  }
  static defaultProps = { topItems: [], leftItems: [], rightItems: [], colour: 'blue' }
  static propTypes =
  { leftItems: PropTypes.array,
    topItems: PropTypes.array,
    rightItems: PropTypes.array,
    children: PropTypes.node,
    displayNavTitle: PropTypes.bool,
    title: PropTypes.string
  }

  handlePusher = () => {
    const { visible } = this.state

    if (visible) this.setState({ visible: false })
  }

  handleToggle = () => this.setState({ visible: !this.state.visible })

  render () {
    const { children, displayNavTitle, title } = this.props
    const { visible } = this.state

    return (
      <React.Fragment>
        <Responsive {...Responsive.onlyMobile}>
          <AdminNavBarMobile
            onPusherClick={this.handlePusher}
            onToggle={this.handleToggle}
            visible={visible}
            {...this.props}
          >
            <Container fluid style={{ marginTop: '2em' }}>
              {children
              }</Container>
          </AdminNavBarMobile>
        </Responsive>
        <Responsive minWidth={Responsive.onlyTablet.minWidth}>
          <AdminNavBarDesktop {...this.props} />
          <Container style={{ marginTop: '1em' }}>
            <Grid columns={2}>
              <Grid.Row>
                <Grid.Column width={4}>
                  <AdminSideTabletNav {...this.props} />
                </Grid.Column>
                <Grid.Column width={12}>
                  { displayNavTitle &&
                    <Header>{title}</Header>
                  }
                  <AdminNavBarChildren {...this.props}>{children}</AdminNavBarChildren>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Container>
        </Responsive>
      </React.Fragment>
    )
  }
}
