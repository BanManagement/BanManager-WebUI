module.exports = function navigation (obj, info, { state }) {
  const left =
  [{ id: 1, name: 'Home', href: '/' },
    { id: 2, name: 'Appeal' },
    { id: 3, name: 'Reports', href: '/reports' },
    { id: 4, name: 'Statistics', href: '/statistics' }
  ]

  if (state.acl.hasPermission('servers', 'manage')) {
    left.push({ id: 5, name: 'Admin', href: '/admin' })
  }

  return { left }
}
