const { find } = require('lodash')
const ExposedError = require('../../../data/exposed-error')
const reusableComponents = require('../../../data/default-components')
const pageLayout = require('../queries/page-layout')

module.exports = async function updatePageLayout (obj, { pathname, input }, { state }) {
  // Find all component ids
  const results = await state.dbPool('bm_web_page_layouts')
    .select('id')
    .where('pathname', pathname)
    .limit(1)

  if (!results.length) throw new ExposedError('Page Layout does not exist')

  await state.dbPool.transaction(async trx => {
    const devices = Object.keys(input)
    const components = []

    devices.forEach(device => {
      // @TODO Validate component is allowed in this pathname
      input[device].components.forEach(({ id, component, x, y, w, h, meta }) => {
        const data = {
          pathname,
          device,
          component,
          x,
          y,
          w,
          h,
          meta: meta ? JSON.stringify(meta) : null
        }

        if (id) data.id = id

        components.push(data)
      })

      input[device].unusedComponents.forEach(({ id, component, x, w, h, meta }) => {
        const data = {
          pathname,
          device,
          component,
          x,
          y: -1,
          w,
          h,
          meta: meta ? JSON.stringify(meta) : null
        }

        if (id) data.id = id

        components.push(data)
      })
    })

    for (const component of components) {
      if (!component.id && component.y === -1) continue
      if (component.id) {
        if (component.y === -1 && find(reusableComponents, { component: component.component })) {
          await trx('bm_web_page_layouts').where({ id: component.id }).del()
        } else {
          await trx('bm_web_page_layouts').update(component).where({ id: component.id })
        }
      } else {
        await trx('bm_web_page_layouts').insert(component)
      }
    }

    await trx.commit()
  })

  return pageLayout(obj, { pathname }, { state })
}
