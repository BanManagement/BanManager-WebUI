module.exports = (db) => {
  async function addComponent (pathname, component) {
    if (!component.device) {
      return Promise.all([
        addComponent(pathname, Object.assign({ device: 'mobile' }, component)),
        addComponent(pathname, Object.assign({ device: 'tablet' }, component)),
        addComponent(pathname, Object.assign({ device: 'desktop' }, component))
      ])
    }

    const cols = ['pathname', 'device', 'component', 'x', 'y', 'w', 'meta']
    const fields = [pathname,
      component.device,
      component.component,
      component.x,
      component.y,
      component.w,
      component.meta ? JSON.stringify(component.meta) : null
    ]

    if (component.h) {
      cols.push('h')
      fields.push(component.h)
    }

    return db.insert('bm_web_page_layouts', cols, fields)
  }

  async function addComponents (pathname, components) {
    return Promise.all(components.map(component => {
      return addComponent(pathname, component)
    }))
  }

  return { addComponent, addComponents }
}
