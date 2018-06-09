import React from 'react'
import {
  Button,
  Form,
  Label,
  Segment,
  Responsive as ResponsiveUtil
} from 'semantic-ui-react'
import GraphQLErrorMessage from 'components/GraphQLErrorMessage'
import { COLORS as COLOURS, TEXT_ALIGNMENTS } from 'semantic-ui-react/dist/commonjs/lib/SUI'
import { capitalize, findIndex, find } from 'lodash'
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

class PageLayoutForm extends React.Component {
  constructor(props) {
    super(props)

    const { pathname, pageLayout } = props

    this.state =
      {
        pathname
      , pageLayout
      , currentLayout: pageLayout.devices.desktop
      , device: 'desktop'
      , deviceWidth: ResponsiveUtil.onlyComputer.minWidth
      , selectedComponent: null
      }
  }

  changeDevice(device, widthName) {
    this.setState(
      { device
      , deviceWidth: ResponsiveUtil[widthName].minWidth
      , currentLayout: this.state.pageLayout.devices[device]
      })
  }

  onSelectComponent(name) {
    this.setState({ selectedComponent: find(this.state.currentLayout, { component: name }) })
  }

  updateColour = (e, { value }) => {
    const { currentLayout, device, pageLayout, selectedComponent } = this.state
    const newLayout = currentLayout.slice()

    // Update currentLayout
    const index = findIndex(currentLayout, { component: selectedComponent.component })

    newLayout[index] = { ...currentLayout[index], colour: value }

    // Update pageLayout
    const newPageLayout = { ...pageLayout }

    newPageLayout.devices = { ...pageLayout.devices, [device]: newLayout }

    const state = {
      selectedComponent: { ...selectedComponent, colour: value }
    , currentLayout: newLayout
    , pageLayout: newPageLayout
    }

    this.setState(state)
  }

  updateTextAlignment = (e, { value }) => {
    const { currentLayout, device, pageLayout, selectedComponent } = this.state
    const newLayout = currentLayout.slice()

    // Update currentLayout
    const index = findIndex(currentLayout, { component: selectedComponent.component })

    newLayout[index] = { ...currentLayout[index], textAlign: value }

    // Update pageLayout
    const newPageLayout = { ...pageLayout }

    newPageLayout.devices = { ...pageLayout.devices, [device]: newLayout }

    const state = {
      selectedComponent: { ...selectedComponent, textAlign: value }
      , currentLayout: newLayout
      , pageLayout: newPageLayout
    }

    this.setState(state)
  }

  onLayoutChange = (layout) => {
    const { currentLayout, device, pageLayout, selectedComponent } = this.state
    const newLayout = []
    let newSelectedComponent

    // Update currentLayout
    layout.forEach(component => {
      const oldComponent = find(currentLayout, { component: component.i })
      const newComponent = { ...oldComponent, ...component }

      if (selectedComponent && selectedComponent.component === component.i) newSelectedComponent = newComponent

      newLayout.push(newComponent)
    })

    // Update pageLayout
    const newPageLayout = { ...pageLayout }

    newPageLayout.devices = { ...pageLayout.devices, [device]: newLayout }

    const state =
      { currentLayout: newLayout
      , pageLayout: newPageLayout
      }

    if (newSelectedComponent) state.selectedComponent = newSelectedComponent

    this.setState(state)
  }

  onSubmit = async (e) => {
    this.setState({ loading: true })

    try {
      await this.props.onSubmit(e, this.state.pageLayout)
    } catch (error) {
      console.error(error)
      this.setState({ error, loading: false })
    }
  }

  render() {
    const { error } = this.props
    const { currentLayout, device, deviceWidth, selectedComponent, loading } = this.state
    const currentLayoutData = currentLayout.map(layout => ({ ...layout, h: 1, i: layout.component }))
    const layoutComponents = currentLayoutData.map(component => {
      const colour = component.colour && component.colour !== 'none' ? { inverted: true, color: component.colour } : {}

      return (
        <div key={component.i} onClick={this.onSelectComponent.bind(this, component.i)}>
          <Segment {...colour}>{component.i}</Segment>
        </div>
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
                  label='Colour:'
                  value={selectedComponent ? selectedComponent.colour : 'none'}
                  onChange={this.updateColour}
                />
              </Form.Field>
              <Form.Field>
                <Form.Select
                  options={textAlignmentOptions}
                  label='Text Align:'
                  value={selectedComponent ? selectedComponent.textAlign : 'none'}
                  onChange={this.updateTextAlignment}
                />
              </Form.Field>
              <Form.Field>
                <label>Width:</label> {selectedComponent ? selectedComponent.w : ''}
              </Form.Field>
            </Form.Group>
          </Form>
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
  pageLayout: PropTypes.object.isRequired
, pathname: PropTypes.string.isRequired
, error: PropTypes.object
}

export default PageLayoutForm
