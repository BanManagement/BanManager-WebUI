module.exports = async function adminNavigation (obj, info, { state }) {
  const { rolesCount } = await state.dbPool('bm_web_roles').count({ rolesCount: '*' }).first()
  // const { pageLayoutsCount } = await state.dbPool.from('bm_web_page_layouts')
  //   .select(state.dbPool.raw('COUNT(DISTINCT pathname) AS pageLayoutsCount'))
  //   .first()
  const left = [
    // { id: 1, name: 'Page Layouts', label: pageLayoutsCount, href: '/admin/page-layouts' },
    { id: 1, name: 'Roles', label: rolesCount, href: '/admin/roles' },
    { id: 2, name: 'Servers', label: state.serversPool.size, href: '/admin/servers' }
  ]

  return { left }
}
