import React from 'react'
import { Container, Grid, Loader, Responsive } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import PageContainer from './PageContainer'
import { GlobalStore } from '../components/GlobalContext'
import { getWidthFactory, useApi } from '../utils'

const query = `query pageLayout($pathname: String!) {
  pageLayout(pathname: $pathname) {
    devices {
      mobile {
        components {
          ...Component
        }
      }
      tablet {
        components {
          ...Component
        }
      }
      desktop {
        components {
          ...Component
        }
      }
    }
  }
}
fragment Component on DeviceComponent {
  component
  x
  y
  w
  colour
  textAlign
  meta
}`

// @TODO Component needs optimising, try and avoid numerous loops
function calculateRowCount (components) {
  const counted = {}

  return components.filter(c => {
    if (c.y >= 0 && !counted[c.y]) {
      counted[c.y] = true
      return true
    }

    return false
  }).length - 1
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

      if (!Component) return null

      props.colour = deviceComponent.colour
      props.meta = deviceComponent.meta || {}

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

    if (components.length > 1) {
      return (
        <Grid.Row key={i}>
          <Grid container>
            {components}
          </Grid>
        </Grid.Row>
      )
    }

    return (
      <Grid.Row key={i}>
        {components}
      </Grid.Row>
    )
  })
}

export default function PageLayout ({ availableComponents, pathname, props = {} }) {
  const store = GlobalStore()
  const { mobile, tablet } = store.get('deviceInfo')
  const { loading, data, errors } = useApi({ query, variables: { pathname } })

  if (loading) return <Loader active />
  if (errors || !data) return <PageContainer><ErrorMessages {...errors} /></PageContainer>

  const { pageLayout } = data
  const devices = Object.keys(pageLayout.devices).filter(name => name !== '__typename')
  const rowCounts = Object.assign({}, ...devices.map(device => {
    return { [device]: calculateRowCount(pageLayout.devices[device].components) }
  }))
  const rows = Object.assign({}, ...devices.map(device => {
    return { [device]: createRows(rowCounts[device], pageLayout.devices[device].components) }
  }))
  const deviceComponents = Object.assign({}, ...devices.map(device => {
    return { [device]: createComponents(rows[device], availableComponents, props) }
  }))
  const getWidth = getWidthFactory(mobile, tablet)

  return (
    <>
      <Responsive {...Responsive.onlyMobile} fireOnMount getWidth={getWidth} maxWidth={Responsive.onlyMobile.maxWidth}>
        <Grid>{deviceComponents.mobile}</Grid>
      </Responsive>
      <Responsive {...Responsive.onlyTablet} fireOnMount getWidth={getWidth} minWidth={Responsive.onlyTablet.minWidth}>
        <Grid>{deviceComponents.tablet}</Grid>
      </Responsive>
      <Responsive {...Responsive.onlyComputer} fireOnMount getWidth={getWidth} minWidth={Responsive.onlyComputer.minWidth}>
        <Grid>{deviceComponents.desktop}</Grid>
      </Responsive>
    </>)
}
