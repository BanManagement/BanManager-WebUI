import React, { useEffect, useState } from 'react'
import { Button, Form, Label, Header, Segment, Responsive as ResponsiveUtil } from 'semantic-ui-react'
import { COLORS as COLOURS, TEXT_ALIGNMENTS } from 'semantic-ui-react/dist/commonjs/lib/SUI'
import GridLayout from 'react-grid-layout'
import { capitalize, find, pick } from 'lodash-es'
import GraphQLErrorMessage from '../GraphQLErrorMessage'
import { useApi } from '../../utils'

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
  return pick(component, ['x', 'y', 'w', 'component', 'colour', 'textAlign', 'id'])
}

export default function PageLayoutForm ({ pathname, pageLayout, onFinished, query }) {
  const [loading, setLoading] = useState(false)
  const [variables, setVariables] = useState({})
  const [currentDevice, setCurrentDevice] = useState({ name: 'desktop', width: ResponsiveUtil.onlyComputer.minWidth })
  const [currentLayout, setCurrentLayout] = useState(pageLayout.devices.desktop)
  const [currentPageLayout, setCurrentPageLayout] = useState(pageLayout)
  const [selectedComponent, setSelectedComponent] = useState(null)

  useEffect(() => {
    const newLayout = { ...currentPageLayout }

    Object.keys(currentPageLayout.devices).forEach(device => {
      if (!currentPageLayout.devices[device].components) return

      newLayout.devices[device] =
        {
          ...currentPageLayout.devices[device],
          components: currentPageLayout.devices[device].components.map(cleanUpComponent),
          unusedComponents: currentPageLayout.devices[device].unusedComponents.map(cleanUpComponent)
        }
    })

    setVariables({ pathname, input: newLayout.devices })
  }, [currentPageLayout])

  const { load, data, graphQLErrors } = useApi({ query, variables }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })

  useEffect(() => setLoading(false), [graphQLErrors])
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].pathname)) onFinished()
  }, [data])

  const changeDevice = (name, widthName) => {
    setSelectedComponent(null)
    setCurrentDevice({ name, width: ResponsiveUtil[widthName].minWidth })
    setCurrentLayout(currentPageLayout.devices[name])
  }
  const onSelectComponent = (index) => setSelectedComponent(index)
  const addComponent = (component) => {
    const updatedComponent = { ...component, y: currentLayout.components.length }

    const unusedComponents = currentLayout.unusedComponents.filter(({ component: name }) => name !== component.component)
    const components = [...currentLayout.components.slice(), updatedComponent]

    setCurrentLayout({ ...currentLayout, components, unusedComponents })
    setCurrentPageLayout({
      ...currentPageLayout,
      devices: {
        ...currentPageLayout.devices,
        [currentDevice.name]: {
          ...currentPageLayout.devices[currentDevice.name],
          components,
          unusedComponents
        }
      }
    })
  }
  const removeComponent = (index, e) => {
    e.stopPropagation()

    const components = currentLayout.components.filter((component, i) => i !== index)
    const unusedComponents = [...currentLayout.unusedComponents.slice(), currentLayout.components[index]]

    setCurrentLayout({ ...currentLayout, components, unusedComponents })
    setCurrentPageLayout({
      ...currentPageLayout,
      devices: {
        ...currentPageLayout.devices,
        [currentDevice.name]: {
          ...currentPageLayout.devices[currentDevice.name],
          components,
          unusedComponents
        }
      }
    })

    if (selectedComponent === index) setSelectedComponent(null)
  }
  const handleComponentChange = (e, { name, value }) => {
    const components = currentLayout.components.map((component, index) => {
      if (selectedComponent !== null && selectedComponent === index) {
        return { ...component, [name]: value === 'none' ? null : value }
      }

      return component
    })

    setCurrentLayout({ ...currentLayout, components })
    setCurrentPageLayout({
      ...currentPageLayout,
      devices: {
        ...currentPageLayout.devices,
        [currentDevice.name]: {
          ...currentPageLayout.devices[currentDevice.name],
          components
        }
      }
    })
  }
  const onLayoutChange = (layout) => {
    let newSelectedComponent
    const components = layout.map((component, index) => {
      const oldComponent = find(currentLayout.components, { component: component.i })
      const newComponent = { ...oldComponent, ...component }

      if (currentLayout.components[selectedComponent] &&
        currentLayout.components[selectedComponent].i === component.i) {
        newSelectedComponent = index
      }

      return newComponent
    })

    setCurrentLayout({ ...currentLayout, components })
    setCurrentPageLayout({
      ...currentPageLayout,
      devices: {
        ...currentPageLayout.devices,
        [currentDevice.name]: {
          ...currentPageLayout.devices[currentDevice.name],
          components
        }
      }
    })

    if (newSelectedComponent) setSelectedComponent(newSelectedComponent)
  }
  const onSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    load()
  }
  const handleReset = () => {
    setCurrentPageLayout(pageLayout)
    setCurrentLayout(pageLayout.devices.desktop)
    setSelectedComponent(null)
  }

  const selected = currentLayout.components[selectedComponent]
  const currentLayoutData = currentLayout.components.map(layout => ({ ...layout, h: 1, i: layout.component }))
  const layoutComponents = currentLayoutData.map((component, index) => {
    const colour = component.colour && component.colour !== 'none' ? { inverted: true, color: component.colour } : {}

    return (
      <div key={component.i} onClick={onSelectComponent.bind(this, index)}>
        <Segment clearing {...colour}>
          {component.i}
          <Button floated='right' icon='trash' size='mini' onClick={removeComponent.bind(this, index)} />
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
          onClick={addComponent.bind(this, component)}
        />
      </Segment>
    )
  })

  return (
    <>
      <Button.Group size='large' color='green' basic>
        <Button
          icon='mobile alternate'
          onClick={changeDevice.bind(this, 'mobile', 'onlyMobile')}
          active={currentDevice.name === 'mobile'}
        />
        <Button
          icon='tablet alternate'
          onClick={changeDevice.bind(this, 'tablet', 'onlyTablet')}
          active={currentDevice.name === 'tablet'}
        />
        <Button
          icon='desktop'
          onClick={changeDevice.bind(this, 'desktop', 'onlyComputer')}
          active={currentDevice.name === 'desktop'}
        />
      </Button.Group>
      <Button color='green' onClick={handleReset}>Reset</Button>
      <Button primary onClick={onSubmit} loading={loading}>Save</Button>
      <Segment>
        <GraphQLErrorMessage error={graphQLErrors} />
        <Form>
          <Form.Group inline>
            <Form.Field>
              <label>Name:</label> {selected ? selected.component : ''}
            </Form.Field>
            <Form.Field>
              <Form.Select
                options={colourOptions}
                name='colour'
                label='Colour:'
                value={selected && selected.colour ? selected.colour : 'none'}
                onChange={handleComponentChange}
              />
            </Form.Field>
            <Form.Field>
              <Form.Select
                options={textAlignmentOptions}
                label='Text Align:'
                name='textAlign'
                value={selected && selected.textAlign ? selected.textAlign : 'none'}
                onChange={handleComponentChange}
              />
            </Form.Field>
            <Form.Field>
              <label>Width:</label> {selected ? selected.w : ''}
            </Form.Field>
          </Form.Group>
        </Form>
      </Segment>
      <Segment>
        <Header>Available Components</Header>
        {unusedComponents}
      </Segment>
      <Segment.Group style={{ width: currentDevice.width }}>
        <GridLayout
          className='layout'
          cols={16}
          width={currentDevice.width}
          rowHeight={47}
          layout={currentLayoutData}
          onLayoutChange={onLayoutChange}
        >
          {layoutComponents}
        </GridLayout>
      </Segment.Group>
    </>
  )
}
