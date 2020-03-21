module.exports = async function adminNavigation (obj, info, { state }) {
  const [[{ rolesCount }]] = await state.dbPool.execute('SELECT COUNT(*) AS rolesCount FROM bm_web_roles')
  const [[{ pageLayoutsCount }]] = await state.dbPool.execute(
    'SELECT COUNT(DISTINCT pathname) AS pageLayoutsCount FROM bm_web_page_layouts')
  const left =
  [{ id: 1, name: 'Roles', label: rolesCount, href: '/admin/roles' },
    { id: 2, name: 'Servers', label: state.serversPool.size, href: '/admin/servers' },
    { id: 3, name: 'Page Layouts', label: pageLayoutsCount, href: '/admin/page-layouts' }
  ]

  return { left }
}
