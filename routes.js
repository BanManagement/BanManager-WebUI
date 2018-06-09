const nextRoutes = require('next-routes')
const routes = module.exports = nextRoutes()

routes
  .add('index', '/')

  .add('login', '/login')
  .add('register', '/register')

  .add('password-set', '/account/password-set')

  .add('player', '/player/:id')

  .add('add-player-ban', '/player/:id/ban')
  .add('edit-player-ban', '/player-ban/:server/:id')

  .add('edit-player-kick', '/player-kick/:server/:id')

  .add('add-player-mute', '/player/:id/mute')
  .add('edit-player-mute', '/player-mute/:server/:id')

  .add('add-player-note', '/player/:id/note')
  .add('edit-player-note', '/player-note/:server/:id')

  .add('add-player-warning', '/player/:id/warning')
  .add('player-warning', '/player-warning/:server/:id')

  .add('appeal', '/appeal/:server/:id/:type')

  .add('reports', '/reports')
  .add('report', '/report/:server/:id')

  .add('admin', '/admin')

  .add('admin-servers', '/admin/servers', '/admin/servers')
  .add('admin-add-server', '/admin/servers/server', '/admin/servers/add-server')
  .add('admin-edit-server', '/admin/servers/:id', '/admin/servers/edit-server')

  .add('admin-roles', '/admin/roles', '/admin/roles')
  .add('admin-add-role', '/admin/roles/role', '/admin/roles/add-role')
  .add('admin-edit-role', '/admin/roles/:id', '/admin/roles/edit-role')

  .add('admin-page-layouts', '/admin/page-layouts', '/admin/page-layouts')
  .add('admin-edit-page-layout', '/admin/page-layouts/:id', '/admin/page-layouts/edit-layout')
