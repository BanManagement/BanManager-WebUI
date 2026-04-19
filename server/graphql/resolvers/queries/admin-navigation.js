module.exports = async function adminNavigation (obj, info, { state }) {
  const { rolesCount } = await state.dbPool('bm_web_roles').count({ rolesCount: '*' }).first()
  const { notificationRulesCount } = await state.dbPool('bm_web_notification_rules').count({ notificationRulesCount: '*' }).first()
  const { webHooksCount } = await state.dbPool('bm_web_webhooks').count({ webHooksCount: '*' }).first()
  const { documentsCount } = await state.dbPool('bm_web_documents').count({ documentsCount: '*' }).first()

  const left = [
    { key: 'documents', name: 'Documents', label: documentsCount, href: '/admin/documents' },
    { key: 'roles', name: 'Roles', label: rolesCount, href: '/admin/roles' },
    { key: 'servers', name: 'Servers', label: state.serversPool.size, href: '/admin/servers' },
    { key: 'notificationRules', name: 'Notification Rules', label: notificationRulesCount, href: '/admin/notification-rules' },
    { key: 'webhooks', name: 'Webhooks', label: webHooksCount, href: '/admin/webhooks' }
  ]

  left.sort((a, b) => a.name.localeCompare(b.name))
  left.forEach((value, index) => { value.id = index + 1 })

  return { left }
}
