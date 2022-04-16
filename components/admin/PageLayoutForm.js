import { useEffect, useMemo, useState } from 'react'
import GridLayout from 'react-grid-layout'
import { find, maxBy, pick } from 'lodash-es'
import ErrorMessages from '../ErrorMessages'
import PageHeader from '../PageHeader'
import Button from '../Button'
import { breakpoints } from '../Media'
import { useMutateApi } from '../../utils'
import { componentsMeta } from './layout'

const cleanUpComponent = (component) => {
  if (component.generated) return pick(component, ['x', 'y', 'w', 'h', 'meta', 'component'])

  return pick(component, ['x', 'y', 'w', 'h', 'meta', 'component', 'id'])
}

export default function PageLayoutForm ({ pathname, pageLayout, onFinished, query }) {
  const [variables, setVariables] = useState({})
  const [currentDevice, setCurrentDevice] = useState({ name: 'desktop', width: breakpoints.computer })
  const [currentLayout, setCurrentLayout] = useState(pageLayout.devices.desktop)
  const [currentPageLayout, setCurrentPageLayout] = useState(pageLayout)
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [meta, setMeta] = useState({})

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
  useEffect(() => {
    if (selectedComponent) {
      handleComponentChange({ name: 'meta', value: meta }, selectedComponent)
    }
  }, [meta])
  useEffect(() => {
    if (selectedComponent) {
      const component = find(currentLayout.components, { id: selectedComponent })

      if (component?.meta) {
        setMeta({ ...component.meta })
      } else {
        setMeta({})
      }
    }
  }, [selectedComponent])

  const { load, loading, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].pathname)) onFinished(data)
  }, [data])

  const changeDevice = (name, widthName) => {
    setSelectedComponent(null)
    setCurrentDevice({ name, width: breakpoints[widthName] })
    setCurrentLayout(currentPageLayout.devices[name])
  }
  const onSelectComponent = (id) => {
    setSelectedComponent(id)
  }
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
    setSelectedComponent(updatedComponent.id)
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
  const handleComponentChange = ({ name, value }, id) => {
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
    const components = layout.map(({ i, w, h, x, y }) => {
      const currentComponent = find(currentLayout.components, { id: i })
      const newComponent = { ...currentComponent, w, h, x, y }

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
  }
  const onSubmit = (e) => {
    e.preventDefault()

    load(variables)
  }
  const handleReset = () => {
    setCurrentPageLayout(pageLayout)
    setCurrentLayout(pageLayout.devices.desktop)
    setSelectedComponent(null)
  }

  const selected = find(currentLayout.components, { id: selectedComponent })
  const FormComponent = componentsMeta[selected?.component]?.edit
  const currentLayoutData = currentLayout.components.map((layout) => ({ ...layout, i: layout.id }))
  const layoutComponents = useMemo(() => currentLayoutData.map(component => {
    return (
      <div key={component.i} className='bg-gray-800' onClick={onSelectComponent.bind(this, component.id)}>
        <div className='flex p-5'>
          <span className='mx-4 text-base m-auto'>{component.component}</span>
        </div>
      </div>
    )
  }), [currentLayoutData])
  const unusedComponents = currentLayout.unusedComponents.concat(pageLayout.devices[currentDevice.name].reusableComponents).map(component => {
    return (
      <div key={component.id ? component.id : component.component} className='bg-gray-800 p-5 m-2 flex'>
        <span>{component.component}</span>
        <span className='flex-grow text-right'>
          <Button
            className='bg-emerald-600 hover:bg-emerald-700 !w-5 h-5'
            onClick={addComponent.bind(this, component)}
          >
            +
          </Button>
        </span>
      </div>
    )
  })

  return (
    <>
      <PageHeader title='Edit Page Layout' />
      <div className='grid grid-flow-col gap-6 justify-start'>
        <Button className='w-28 bg-gray-700 hover:bg-gray-800' onClick={handleReset}>Reset</Button>
        <Button className='w-28' onClick={onSubmit} loading={loading}>Save</Button>
      </div>
      <div className='grid grid-flow-col mt-6 gap-6 justify-between'>
        <div>
          <div style={{ width: currentDevice.width }}>
            <GridLayout
              className='layout bg-black'
              cols={12}
              width={currentDevice.width}
              rowHeight={66}
              layout={currentLayoutData}
              onLayoutChange={onLayoutChange}
            >
              {layoutComponents}
            </GridLayout>
          </div>
        </div>
        <div className='w-96 items-end'>
          <div className='grid grid-flow-row'>
            <div className='bg-black p-5'>
              <div className='grid grid-flow-row gap-6'>
                <Button
                  onClick={changeDevice.bind(this, 'mobile', 'mobile')}
                  disabled={currentDevice.name === 'mobile'}
                >
                  Mobile
                </Button>
                <Button
                  onClick={changeDevice.bind(this, 'tablet', 'tablet')}
                  disabled={currentDevice.name === 'tablet'}
                >
                  Tablet
                </Button>
                <Button
                  onClick={changeDevice.bind(this, 'desktop', 'computer')}
                  disabled={currentDevice.name === 'desktop'}
                >
                  Desktop
                </Button>
              </div>
            </div>
            <div className='bg-black p-5'>
              <PageHeader title='Available Components' />
              {unusedComponents}
            </div>
            {selected &&
              <div className='bg-gray-800 p-5'>
                <ErrorMessages errors={errors} />
                <form className='m-2'>
                  <div className='flex'>
                    <h6 className='text-lg'>Selected</h6>
                    <span className='flex-grow text-right'>
                      <span className='px-4 py-2 text-base rounded-full text-white bg-accent-500'>
                        {selected.component}
                      </span>
                    </span>
                  </div>
                  <div className='mt-6'>
                    {FormComponent && <FormComponent meta={meta} setMeta={setMeta} />}
                    <Button className='mt-6 bg-red-600 hover:bg-red-700' onClick={removeComponent.bind(this, selected.id)}>
                      Delete
                    </Button>
                  </div>
                </form>
              </div>}
          </div>
        </div>
      </div>
    </>
  )
}
