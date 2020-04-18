module.exports = async function pageLayouts (obj, info, { state: { dbPool } }) {
  const results = await dbPool('bm_web_page_layouts').select('*')
  // @TODO Clean up
  const pageLayouts = {}

  results.forEach(result => {
    if (!pageLayouts[result.pathname]) pageLayouts[result.pathname] = {}

    const devices = pageLayouts[result.pathname]
    const { device, y } = result

    if (result.meta) result.meta = JSON.parse(result.meta)

    if (!devices[device]) devices[device] = { reusableComponents: [] }
    if (!devices[device].unusedComponents) devices[device].unusedComponents = []
    if (!devices[device].components) devices[device].components = []
    devices[device].reusableComponents = []

    if (y < 0) {
      devices[device].unusedComponents.push(result)
    } else {
      devices[device].components.push(result)
    }
  })

  return Object.keys(pageLayouts).map(pathname => {
    return {
      pathname: pathname,
      devices: pageLayouts[pathname]
    }
  })
}
