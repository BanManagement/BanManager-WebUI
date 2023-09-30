module.exports = async function adminNavigation (obj, info, { state }) {
  const { rolesCount } = await state.dbPool('bm_web_roles').count({ rolesCount: '*' }).first()
  const { notificationRulesCount } = await state.dbPool('bm_web_notification_rules').count({ notificationRulesCount: '*' }).first()
  const left = [
    { name: 'Roles', label: rolesCount, href: '/admin/roles' },
    { name: 'Servers', label: state.serversPool.size, href: '/admin/servers' },
    { name: 'Notification Rules', label: notificationRulesCount, href: '/admin/notification-rules' }
  ]

  left.sort((a, b) => a.name.localeCompare(b.name))
  left.forEach((value, index) => { value.id = index + 1 })

  return { left }
}
