const ExposedError = require('../../../data/exposed-error')
const reusableComponents = require('../../../data/default-components')

module.exports = async function pageLayout (obj, { pathname }, { state: { dbPool } }) {
  const results = await dbPool('bm_web_page_layouts').select('*').where('pathname', pathname)

  if (!results.length) throw new ExposedError('Page Layout not found')

  const devices = {}

  results.forEach(result => {
    const { device, y } = result

    if (result.meta) result.meta = JSON.parse(result.meta)

    if (!devices[device]) devices[device] = { reusableComponents }
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
