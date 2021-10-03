import { useEffect, useState } from 'react'
import { Button, Form, Grid, Label, Header, Modal, Segment, Responsive as ResponsiveUtil } from 'semantic-ui-react'
import { COLORS as COLOURS, TEXT_ALIGNMENTS } from 'semantic-ui-react/dist/commonjs/lib/SUI'
import GridLayout from 'react-grid-layout'
import { capitalize, find, maxBy, pick } from 'lodash-es'
import ErrorMessages from '../ErrorMessages'
import { useMutateApi } from '../../utils'
import { componentsMeta } from './layout'

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
  if (component.generated) return pick(component, ['x', 'y', 'w', 'meta', 'component', 'colour', 'textAlign'])

  return pick(component, ['x', 'y', 'w', 'meta', 'component', 'colour', 'textAlign', 'id'])
}

export default function PageLayoutForm ({ pathname, pageLayout, onFinished, query }) {
  const [loading, setLoading] = useState(false)
  const [variables, setVariables] = useState({})
  const [currentDevice, setCurrentDevice] = useState({ name: 'desktop', width: ResponsiveUtil.onlyComputer.minWidth })
  const [currentLayout, setCurrentLayout] = useState(pageLayout.devices.desktop)
  const [currentPageLayout, setCurrentPageLayout] = useState(pageLayout)
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [openComponentForm, setOpenComponentForm] = useState(null)

  useEffect(() => {
    const newLayout = { devices: {} }

    Object.keys(currentPageLayout.devices).forEach(device => {
      if (!currentPageLayout.devices[device].components) return

      newLayout.devices[device] =
        {
          ...currentPageLayout.devices[device],
          components: currentPageLayout.devices[device].components.map(cleanUpComponent),
          unusedComponents: currentPageLayout.devices[device].unusedComponents.map(cleanUpComponent),
          reusableComponents: undefined
        }
    })

    setVariables({ pathname, input: newLayout.devices })
  }, [currentPageLayout])

  const { load, data, errors } = useMutateApi({ query })

  useEffect(() => setLoading(false), [errors])
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].pathname)) onFinished()
  }, [data])

  const changeDevice = (name, widthName) => {
    setSelectedComponent(null)
    setCurrentDevice({ name, width: ResponsiveUtil[widthName].minWidth })
    setCurrentLayout(currentPageLayout.devices[name])
  }
  const onSelectComponent = (id) => setSelectedComponent(id)
  const addComponent = (component) => {
    const updatedComponent = { ...component, y: currentLayout.components.length }

    if (!updatedComponent.id) {
      updatedComponent.id = (parseInt(maxBy(currentLayout.components, ({ id }) => parseInt(id, 10)).id, 10) + 1).toString()
      updatedComponent.generated = true
    }

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
  const removeComponent = (id, e) => {
    e.stopPropagation()

    const currentComponent = find(currentLayout.components, { id })
    const components = currentLayout.components.filter(component => component.id !== id)
    let unusedComponents = currentLayout.unusedComponents.slice()

    if (!currentComponent.generated) {
      unusedComponents = [...currentLayout.unusedComponents.slice(), currentComponent]
    }

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

    if (selectedComponent === currentComponent.id) setSelectedComponent(null)
  }
  const editComponent = (id, e) => {
    e.stopPropagation()

    const component = find(currentLayout.components, { id })
    const FormComponent = componentsMeta[component.component].edit
    const setMeta = (meta) => {
      handleComponentChange(null, { name: 'meta', value: meta }, id)
      handleCloseComponentForm()
    }

    setOpenComponentForm(<FormComponent meta={{ ...component.meta }} setMeta={setMeta} />)
  }
  const handleCloseComponentForm = () => {
    setOpenComponentForm(null)
  }
  const handleComponentChange = (e, { name, value }, id) => {
    const components = currentLayout.components.map((component) => {
      if ((id && component.id === id) || (selectedComponent !== null && selectedComponent === component.id)) {
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
    const components = layout.map(({ i, w, x, y }) => {
      const currentComponent = find(currentLayout.components, { id: i })
      const newComponent = { ...currentComponent, w, x, y }

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

    // if (newSelectedComponent) setSelectedComponent(newSelectedComponent)
  }
  const onSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    load(variables)
  }
  const handleReset = () => {
    setCurrentPageLayout(pageLayout)
    setCurrentLayout(pageLayout.devices.desktop)
    setSelectedComponent(null)
  }

  const selected = find(currentLayout.components, { id: selectedComponent })
  const currentLayoutData = currentLayout.components.map((layout) => ({ ...layout, h: 1, i: layout.id }))
  const layoutComponents = currentLayoutData.map(component => {
    const colour = component.colour && component.colour !== 'none' ? { inverted: true, color: component.colour } : {}
    const editForm = componentsMeta[component.component] ? componentsMeta[component.component].edit : null

    return (
      <div key={component.i} onClick={onSelectComponent.bind(this, component.id)}>
        <Segment {...colour}>
          <Grid columns={2} stackable>
            <Grid.Row verticalAlign='middle'>
              <Grid.Column>{component.component}</Grid.Column>
              <Grid.Column textAlign='right'>
                <Button icon='trash' size='mini' onClick={removeComponent.bind(this, component.id)} />
                {!!editForm &&
                  <Button icon='pencil' size='mini' onClick={editComponent.bind(this, component.id)} />}
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
      </div>
    )
  })
  const unusedComponents = currentLayout.unusedComponents.concat(pageLayout.devices[currentDevice.name].reusableComponents).map(component => {
    return (
      <Segment key={component.id ? component.id : component.component}>
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
      <Modal
        open={!!openComponentForm}
        onClose={handleCloseComponentForm}
      >
        <Header>
          Edit
        </Header>
        <Modal.Content>
          {openComponentForm}
        </Modal.Content>
      </Modal>
      <Segment>
        <ErrorMessages errors={errors} />
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
