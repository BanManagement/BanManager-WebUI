import React from 'react'
import {
  Button,
  Form,
  Label,
  Header,
  Segment,
  Responsive as ResponsiveUtil
} from 'semantic-ui-react'
import GraphQLErrorMessage from 'components/GraphQLErrorMessage'
import { COLORS as COLOURS, TEXT_ALIGNMENTS } from 'semantic-ui-react/dist/commonjs/lib/SUI'
import { capitalize, find, pick } from 'lodash-es'
import PropTypes from 'prop-types'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const colourOptions = COLOURS.map(colour => {
  const text = capitalize(colour)

  return { key: colour, text, value: colour, content: <Label color={colour}>{text}</Label> }
})

colourOptions.unshift({ key: 'none', text: 'None', value: 'none' })

const textAlignmentOptions = TEXT_ALIGNMENTS.map(alignment => {
  const text = capitalize(alignment)

  return { key: alignment, text, value: alignment }
})

textAlignmentOptions.unshift({ key: 'none', text: 'None', value: 'none' })

const cleanUpComponent = (component) => {
  return pick(component, [ 'x', 'y', 'w', 'component', 'colour', 'textAlign', 'id' ])
}

class PageLayoutForm extends React.Component {
  constructor (props) {
    super(props)

    const { pathname, pageLayout } = props

    this.state =
      { pathname,
        pageLayout,
        currentLayout: pageLayout.devices.desktop,
        device: 'desktop',
        deviceWidth: ResponsiveUtil.onlyComputer.minWidth,
        selectedComponent: null
      }
  }

  changeDevice (device, widthName) {
    this.setState(
      { device,
        deviceWidth: ResponsiveUtil[widthName].minWidth,
        currentLayout: this.state.pageLayout.devices[device]
      })
  }

  onSelectComponent (index) {
    this.setState({ selectedComponent: index })
  }

  addComponent (component) {
    const { currentLayout, device, pageLayout } = this.state

    const updatedComponent = { ...component, y: currentLayout.components.length }

    const unusedComponents = currentLayout.unusedComponents.filter(({ component: name }) => name !== component.component)
    const updatedComponents = [ ...currentLayout.components.slice(), updatedComponent ]
    const newState = {
      currentLayout:
        { ...currentLayout,
          components: updatedComponents,
          unusedComponents
        },
      pageLayout:
      { ...pageLayout,
        devices:
        { ...pageLayout.devices,
          [device]:
          { ...pageLayout.devices[device],
            components: updatedComponents,
            unusedComponents
          }
        }
      }
    }

    this.setState(newState)
  }

  removeComponent (index, e) {
    e.stopPropagation()

    const { currentLayout, device, pageLayout, selectedComponent } = this.state
    const updatedComponents = currentLayout.components.filter((component, i) => i !== index)
    const unusedComponents = [ ...currentLayout.unusedComponents.slice(), currentLayout.components[index] ]
    const newState = {
      currentLayout:
        { ...currentLayout,
          components: updatedComponents,
          unusedComponents
        },
      pageLayout:
      { ...pageLayout,
        devices:
        { ...pageLayout.devices,
          [device]:
          { ...pageLayout.devices[device],
            components: updatedComponents,
            unusedComponents
          }
        }
      }
    }

    if (selectedComponent === index) newState.selectedComponent = null

    this.setState(newState)
  }

  handleComponentChange = (e, { name, value }) => {
    const { currentLayout, device, pageLayout, selectedComponent } = this.state
    const updatedComponents = currentLayout.components.map((component, index) => {
      if (selectedComponent !== null && selectedComponent === index) {
        return { ...component, [name]: value === 'none' ? null : value }
      }

      return component
    })

    const newState = {
      currentLayout:
        { ...currentLayout,
          components: updatedComponents
        },
      pageLayout:
      { ...pageLayout,
        devices:
        { ...pageLayout.devices,
          [device]:
          { ...pageLayout.devices[device],
            components: updatedComponents
          }
        }
      }
    }

    this.setState(newState)
  }

  onLayoutChange = (layout) => {
    let newSelectedComponent
    const { currentLayout, device, pageLayout, selectedComponent } = this.state
    const updatedComponents = layout.map((component, index) => {
      const oldComponent = find(currentLayout.components, { component: component.i })
      const newComponent = { ...oldComponent, ...component }

      if (currentLayout.components[selectedComponent] &&
        currentLayout.components[selectedComponent].i === component.i) {
        newSelectedComponent = index
      }

      return newComponent
    })

    const newState = {
      currentLayout:
        { ...currentLayout,
          components: updatedComponents
        },
      pageLayout:
      { ...pageLayout,
        devices:
        { ...pageLayout.devices,
          [device]:
          { ...pageLayout.devices[device],
            components: updatedComponents
          }
        }
      }
    }

    if (newSelectedComponent) newState.selectedComponent = newSelectedComponent

    this.setState(newState)
  }

  onSubmit = async (e) => {
    this.setState({ loading: true })

    const pageLayout = { ...this.state.pageLayout }

    Object.keys(pageLayout.devices).forEach(device => {
      if (!pageLayout.devices[device].components) return

      pageLayout.devices[device] =
        { ...pageLayout.devices[device],
          components: pageLayout.devices[device].components.map(cleanUpComponent),
          unusedComponents: pageLayout.devices[device].unusedComponents.map(cleanUpComponent)
        }
    })

    try {
      await this.props.onSubmit(e, pageLayout)
    } catch (error) {
      console.error(error)
      this.setState({ error, loading: false })
    }
  }

  render () {
    const { error } = this.props
    const { currentLayout, device, deviceWidth, selectedComponent: selectedComponentIndex, loading } = this.state
    const selectedComponent = currentLayout.components[selectedComponentIndex]
    const currentLayoutData = currentLayout.components.map(layout => ({ ...layout, h: 1, i: layout.component }))
    const layoutComponents = currentLayoutData.map((component, index) => {
      const colour = component.colour && component.colour !== 'none' ? { inverted: true, color: component.colour } : {}

      return (
        <div key={component.i} onClick={this.onSelectComponent.bind(this, index)}>
          <Segment clearing {...colour}>
            {component.i}
            <Button floated='right' icon='trash' size='mini' onClick={this.removeComponent.bind(this, index)} />
          </Segment>
        </div>
      )
    })
    const unusedComponents = currentLayout.unusedComponents.map(component => {
      return (
        <Segment key={component.component}>
          {component.component}
          <Button
            floated='right'
            color='green'
            icon='plus'
            size='mini'
            onClick={this.addComponent.bind(this, component)}
          />
        </Segment>
      )
    })

    return (
      <React.Fragment>
        <Button.Group size='large' color='green' basic>
          <Button
            icon='mobile alternate'
            onClick={this.changeDevice.bind(this, 'mobile', 'onlyMobile')}
            active={device === 'mobile'}
          />
          <Button icon='tablet alternate'
            onClick={this.changeDevice.bind(this, 'tablet', 'onlyTablet')}
            active={device === 'tablet'}
          />
          <Button icon='desktop'
            onClick={this.changeDevice.bind(this, 'desktop', 'onlyComputer')}
            active={device === 'desktop'}
          />
        </Button.Group>
        <Button color='green'>Reset</Button>
        <Button primary onClick={this.onSubmit} loading={loading}>Save</Button>
        <Segment>
          <GraphQLErrorMessage error={error || this.state.error} />
          <Form>
            <Form.Group inline>
              <Form.Field>
                <label>Name:</label> {selectedComponent ? selectedComponent.component : ''}
              </Form.Field>
              <Form.Field>
                <Form.Select
                  options={colourOptions}
                  name='colour'
                  label='Colour:'
                  value={selectedComponent && selectedComponent.colour ? selectedComponent.colour : 'none'}
                  onChange={this.handleComponentChange}
                />
              </Form.Field>
              <Form.Field>
                <Form.Select
                  options={textAlignmentOptions}
                  label='Text Align:'
                  name='textAlign'
                  value={selectedComponent && selectedComponent.textAlign ? selectedComponent.textAlign : 'none'}
                  onChange={this.handleComponentChange}
                />
              </Form.Field>
              <Form.Field>
                <label>Width:</label> {selectedComponent ? selectedComponent.w : ''}
              </Form.Field>
            </Form.Group>
          </Form>
        </Segment>
        <Segment>
          <Header>Available Components</Header>
          {unusedComponents}
        </Segment>
        <Segment.Group style={{ width: deviceWidth }}>
          <GridLayout
            className='layout'
            cols={16}
            width={deviceWidth}
            rowHeight={47}
            layout={currentLayoutData}
            onLayoutChange={this.onLayoutChange}
          >
            {layoutComponents}
          </GridLayout>
        </Segment.Group>
      </React.Fragment>
    )
  }
}

PageLayoutForm.propTypes = {
  pageLayout: PropTypes.object.isRequired,
  pathname: PropTypes.string.isRequired,
  error: PropTypes.object
}

export default PageLayoutForm
