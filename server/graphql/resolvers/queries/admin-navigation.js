module.exports = async function adminNavigation (obj, info, { state }) {
  const { rolesCount } = await state.dbPool('bm_web_roles').count({ rolesCount: '*' }).first()
  const { notificationRulesCount } = await state.dbPool('bm_web_notification_rules').count({ notificationRulesCount: '*' }).first()
  // const { pageLayoutsCount } = await state.dbPool.from('bm_web_page_layouts')
  //   .select(state.dbPool.raw('COUNT(DISTINCT pathname) AS pageLayoutsCount'))
  //   .first()
  const left = [
    // { id: 1, name: 'Page Layouts', label: pageLayoutsCount, href: '/admin/page-layouts' },
    { name: 'Roles', label: rolesCount, href: '/admin/roles' },
    { name: 'Servers', label: state.serversPool.size, href: '/admin/servers' },
    { name: 'Notification Rules', label: notificationRulesCount, href: '/admin/notification-rules' }
  ]

  left.sort((a, b) => a.name.localeCompare(b.name))
  left.forEach((value, index) => { value.id = index + 1 })

  return { left }
}
