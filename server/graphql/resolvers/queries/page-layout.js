const ExposedError = require('../../../data/exposed-error')

module.exports = async function pageLayout (obj, { pathname }, { state: { dbPool } }) {
  const [results] = await dbPool.execute('SELECT * FROM bm_web_page_layouts WHERE pathname = ?', [pathname])

  if (!results.length) throw new ExposedError('Page Layout not found')

  const devices = {}

  results.forEach(result => {
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

  return { pathname, devices }
}
