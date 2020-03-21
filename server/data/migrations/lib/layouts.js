const noop = () => { }

module.exports = (db) => {
  async function addComponent (pathname, component) {
    if (!component.device) {
      return Promise.all([
        addComponent(pathname, Object.assign({ device: 'mobile' }, component)),
        addComponent(pathname, Object.assign({ device: 'tablet' }, component)),
        addComponent(pathname, Object.assign({ device: 'desktop' }, component))
      ])
    }

    return db.insert('bm_web_page_layouts', ['pathname', 'device', 'component', 'x', 'y', 'w', 'colour', 'textAlign']
      , [pathname,
        component.device,
        component.component,
        component.x,
        component.y,
        component.w,
        component.colour || null,
        component.textAlign || null
      ]
      , noop)
  }

  async function addComponents (pathname, components) {
    return Promise.all(components.map(component => {
      return addComponent(pathname, component)
    }))
  }

  return { addComponent, addComponents }
}
