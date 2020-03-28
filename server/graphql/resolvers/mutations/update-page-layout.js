const { find } = require('lodash')
const { insert, update, delete: deleteData } = require('../../../data/udify')
const ExposedError = require('../../../data/exposed-error')
const reusableComponents = require('../../../data/default-components')
const pageLayout = require('../queries/page-layout')

module.exports = async function updatePageLayout (obj, { pathname, input }, { log, state }) {
  // Find all component ids
  const [results] = await state.dbPool.execute('SELECT id FROM bm_web_page_layouts WHERE pathname = ? LIMIT 1',
    [pathname])

  if (!results.length) throw new ExposedError('Page Layout does not exist')

  const conn = await state.dbPool.getConnection()

  try {
    await conn.beginTransaction()

    const devices = Object.keys(input)
    const components = []

    devices.forEach(device => {
      // @TODO Validate component is allowed in this pathname
      input[device].components.forEach(({ id, component, x, y, w, textAlign, colour, meta }) => {
        const data = {
          pathname,
          device,
          component,
          x,
          y,
          w,
          textAlign: textAlign || null,
          colour: colour || null,
          meta: meta || null
        }

        if (id) data.id = id

        components.push(data)
      })

      input[device].unusedComponents.forEach(({ id, component, x, w, textAlign, colour, meta }) => {
        const data = {
          pathname,
          device,
          component,
          x,
          y: -1,
          w,
          textAlign: textAlign || null,
          colour: colour || null,
          meta: meta || null
        }

        if (id) data.id = id

        components.push(data)
      })
    })

    for (const component of components) {
      if (!component.id && component.y === -1) continue
      if (component.id) {
        if (component.y === -1 && find(reusableComponents, { component: component.component })) {
          await deleteData(conn, 'bm_web_page_layouts', { id: component.id })
        } else {
          await update(conn, 'bm_web_page_layouts', component, { id: component.id })
        }
      } else {
        await insert(conn, 'bm_web_page_layouts', component)
      }
    }

    await conn.commit()
  } catch (e) {
    log.error(e)

    if (!conn.connection._fatalError) {
      await conn.rollback()
    }

    throw e
  } finally {
    conn.release()
  }

  return pageLayout(obj, { pathname }, { state })
}
