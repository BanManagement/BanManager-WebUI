module.exports = function navigation (obj, info, { state, session }) {
  const left = []

  if (!session.playerId) {
    left.push({ id: left.length, name: 'Login', href: '/login' })
  } else {
    left.push({ id: left.length, name: 'Dashboard', href: '/dashboard' })
  }

  if (state.acl.hasPermission('servers', 'manage')) {
    left.push({ id: left.length, name: 'Admin', href: '/admin' })
  }

  return { left }
}
