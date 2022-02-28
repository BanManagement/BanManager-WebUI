import { useRef } from 'react'
import Loader from '../components/Loader'
import ErrorMessages from './ErrorMessages'
import PageContainer from './PageContainer'
import { useApi } from '../utils'
import { Media, MediaContextProvider } from '../components/Media'
import ResponsiveGridLayout from './ResponsiveGridLayout'

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
  id
  component
  x
  y
  w
  h
  meta
}`

function createComponents (layout, availableComponents, props) {
  return layout.map((deviceComponent) => {
    const Component = availableComponents[deviceComponent.component]

    if (!Component) return null

    props.meta = deviceComponent.meta || {}

    const rendered = (
      <div i={deviceComponent.id} className='grid-item-wrapper' key={deviceComponent.id}>
        <Component id={'c-' + deviceComponent.id} {...props} />
      </div>
    )

    return rendered
  })
}

export default function PageLayout ({ availableComponents, pathname, props = {} }) {
  const nodeRef = useRef()
  const { loading, data, errors } = useApi({ query, variables: { pathname } })

  if (loading) return <Loader active />
  if (errors || !data) return <PageContainer><ErrorMessages errors={errors} /></PageContainer>

  const { pageLayout } = data
  const devices = Object.keys(pageLayout.devices).filter(name => name !== '__typename')
  const layouts = Object.assign({}, ...devices.map(device => {
    return { [device]: pageLayout.devices[device].components.map((layout) => ({ ...layout, i: layout.id })) }
  }))
  const cols = Object.assign({}, ...devices.map(device => {
    return { [device]: 12 }
  }))
  const deviceComponents = Object.assign({}, ...devices.map(device => {
    return { [device]: createComponents(pageLayout.devices[device].components, availableComponents, props) }
  }))

  return (
    <MediaContextProvider>
      <div className='container mx-auto mb-8' ref={nodeRef}>
        <Media at='mobile'>
          <ResponsiveGridLayout
            autoSize={false}
            className='layout'
            layouts={layouts}
            cols={cols}
            breakpoints={{ mobile: 320, tablet: 768, desktop: 992 }}
            isResizable={false}
            isDraggable={false}
            rowHeight={1}
          >
            {/* {deviceComponents.mobile} */}
          </ResponsiveGridLayout>
        </Media>
        <Media at='tablet'>
          <ResponsiveGridLayout
            className='layout'
            layouts={layouts}
            cols={cols}
            breakpoints={{ mobile: 320, tablet: 768, desktop: 992 }}
            isResizable={false}
            isDraggable={false}
            rowHeight={1}
          >
            {deviceComponents.tablet}
          </ResponsiveGridLayout>
        </Media>
        <Media greaterThanOrEqual='computer'>
          <ResponsiveGridLayout
            autoSize={false}
            autoHeight
            className='layout'
            layouts={layouts}
            cols={cols}
            breakpoints={{ mobile: 320, tablet: 768, desktop: 992 }}
            isResizable={false}
            isDraggable={false}
            rowHeight={1}
          >
            {deviceComponents.desktop}
          </ResponsiveGridLayout>
        </Media>
      </div>
    </MediaContextProvider>
  )
}
