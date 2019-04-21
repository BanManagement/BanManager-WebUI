import React from 'react'
import PropTypes from 'prop-types'
import {
  Container,
  Grid,
  Responsive
} from 'semantic-ui-react'
import getWidthFactory from 'lib/widthFactory'
import GlobalContext from 'lib/GlobalContext'

// @TODO Component needs optimising, try and avoid numerous loops
function calculateRowCount (components) {
  return components.reduce(function (x, y) {
    return (x.y > y.y) ? x.y : y.y
  })
}

function createRows (rowCount, components) {
  const rows = []

  for (let i = 0; i <= rowCount; i++) {
    rows[i] = []
  }

  components.forEach(deviceComponent => {
    rows[deviceComponent.y].push(deviceComponent)
  })

  return rows
}

function createComponents (rows, availableComponents, props) {
  return rows.map((row, i) => {
    const components = row.sort((a, b) => a.x - b.x).map((deviceComponent, index) => {
      const Component = availableComponents[deviceComponent.component]
      const rendered =
        <Grid.Column
          width={deviceComponent.w}
          color={deviceComponent.colour}
          key={index}
          textAlign={deviceComponent.textAlign}
        >
          <Container><Component {...props} /></Container>
        </Grid.Column>

      return rendered
    })

    return (
      <Grid.Row key={i}>
        {components}
      </Grid.Row>
    )
  })
}

export default class PageLayout extends React.Component {
  static propTypes =
    { availableComponents: PropTypes.object.isRequired,
      pageLayout: PropTypes.object.isRequired
    }

  render () {
    const { availableComponents, pageLayout } = this.props
    const devices = Object.keys(pageLayout.devices).filter(name => name !== '__typename')
    const rowCounts = Object.assign({}, ...devices.map(device => {
      return { [device]: calculateRowCount(pageLayout.devices[device].components) }
    }))
    const rows = Object.assign({}, ...devices.map(device => {
      return { [device]: createRows(rowCounts[device], pageLayout.devices[device].components) }
    }))
    const deviceComponents = Object.assign({}, ...devices.map(device => {
      return { [device]: createComponents(rows[device], availableComponents, this.props) }
    }))

    const components = <GlobalContext.Consumer>
      {context => {
        const getWidth = getWidthFactory(context.isMobileFromSSR)

        return (<React.Fragment>
          <Responsive {...Responsive.onlyMobile} fireOnMount getWidth={getWidth} maxWidth={Responsive.onlyMobile.maxWidth}>
            <Grid>{deviceComponents.mobile}</Grid>
          </Responsive>
          <Responsive {...Responsive.onlyTablet} fireOnMount getWidth={getWidth} minWidth={Responsive.onlyTablet.minWidth}>
            <Grid>{deviceComponents.tablet}</Grid>
          </Responsive>
          <Responsive {...Responsive.onlyComputer} fireOnMount getWidth={getWidth} minWidth={Responsive.onlyComputer.minWidth}>
            <Grid >{deviceComponents.desktop}</Grid>
          </Responsive>
        </React.Fragment>)
      }}
    </GlobalContext.Consumer>

    return components
  }
}
