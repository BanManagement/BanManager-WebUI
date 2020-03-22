module.exports = async function pageLayouts (obj, info, { state: { dbPool } }) {
  const [results] = await dbPool.execute('SELECT * FROM bm_web_page_layouts')
  // @TODO Clean up
  const pageLayouts = {}

  results.forEach(result => {
    if (!pageLayouts[result.pathname]) pageLayouts[result.pathname] = {}

    const devices = pageLayouts[result.pathname]
    const { device, y } = result

    if (!devices[device]) devices[device] = {}
    if (!devices[device].unusedComponents) devices[device].unusedComponents = []
    if (!devices[device].components) devices[device].components = []

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
