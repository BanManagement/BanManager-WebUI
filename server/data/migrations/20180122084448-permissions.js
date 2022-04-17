const aclHelper = require('./lib/acl')
// let dbm
// let type
// let seed

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (/* options, seedLink */) {
  // dbm = options.dbmigrate
  // type = dbm.dataType
  // seed = seedLink
}

// eslint-disable-next-line max-statements
exports.up = async function (db) {
  await db.insert('bm_web_roles', ['role_id', 'name'], [1, 'Guest'])
  await db.insert('bm_web_roles', ['role_id', 'name'], [2, 'Logged In'])
  await db.insert('bm_web_roles', ['role_id', 'name'], [3, 'Admin'])

  const { addResource, addPermission, attachPermission } = aclHelper(db)

  await addResource('servers')
  await addResource('players')
  await addResource('player.alts')
  await addResource('player.bans')
  await addResource('player.history')
  await addResource('player.ips')
  await addResource('player.kicks')
  await addResource('player.mutes')
  await addResource('player.notes')
  await addResource('player.reports')
  await addResource('player.warnings')

  await addPermission('servers', 'view', 'manage')
  await addPermission('players', 'view', 'ip')
  await addPermission('player.alts', 'view')
  await addPermission('player.bans'
    , 'create'
    , 'update.any'
    , 'update.own'
    , 'delete.any'
    , 'delete.own'
    , 'view'
  )
  await addPermission('player.ips', 'view')
  await addPermission('player.history', 'view')
  await addPermission('player.kicks'
    , 'update.any'
    , 'update.own'
    , 'delete.any'
    , 'delete.own'
    , 'view'
  )
  await addPermission('player.mutes'
    , 'create'
    , 'update.any'
    , 'update.own'
    , 'delete.any'
    , 'delete.own'
    , 'view'
  )
  await addPermission('player.notes'
    , 'create'
    , 'update.any'
    , 'update.own'
    , 'delete.any'
    , 'delete.own'
    , 'view'
  )
  await addPermission('player.warnings'
    , 'create'
    , 'update.any'
    , 'update.own'
    , 'delete.any'
    , 'delete.own'
    , 'view'
  )
  await addPermission('player.reports'
    , 'update.state.any'
    , 'update.state.own'
    , 'update.state.assigned'
    , 'update.state.reported'
    , 'update.assign.any'
    , 'update.assign.own'
    , 'update.assign.assigned'
    , 'update.assign.reported'
    , 'comment.any'
    , 'comment.own'
    , 'comment.assigned'
    , 'comment.reported'
    , 'comment.delete.any'
    , 'comment.delete.own'
    , 'delete.any'
    , 'delete.assigned'
    , 'view.any'
    , 'view.own'
    , 'view.assigned'
    , 'view.reported'
    , 'view.serverlogs'
    , 'view.comments'
    , 'view.commands'
  )

  await attachPermission('servers', 1, 'view')
  await attachPermission('servers', 2, 'view')
  await attachPermission('servers', 3, 'view', 'manage')

  await attachPermission('players', 1, 'view')
  await attachPermission('players', 2, 'view')
  await attachPermission('players', 3, 'view')

  await attachPermission('player.alts', 3, 'view')

  await attachPermission('player.bans', 1
    , 'view'
  )
  await attachPermission('player.bans', 2
    , 'view'
  )
  await attachPermission('player.bans', 3
    , 'create'
    , 'update.any'
    , 'update.own'
    , 'delete.any'
    , 'delete.own'
    , 'view'
  )

  await attachPermission('player.ips', 3, 'view')

  await attachPermission('player.history', 3, 'view')

  await attachPermission('player.kicks', 3
    , 'update.any'
    , 'update.own'
    , 'delete.any'
    , 'delete.own'
    , 'view'
  )

  await attachPermission('player.mutes', 1
    , 'view'
  )
  await attachPermission('player.mutes', 2
    , 'view'
  )
  await attachPermission('player.mutes', 3
    , 'create'
    , 'update.any'
    , 'update.own'
    , 'delete.any'
    , 'delete.own'
    , 'view'
  )

  await attachPermission('player.notes', 3
    , 'create'
    , 'update.any'
    , 'update.own'
    , 'delete.any'
    , 'delete.own'
    , 'view'
  )

  await attachPermission('player.warnings', 1
    , 'view'
  )
  await attachPermission('player.warnings', 2
    , 'view'
  )
  await attachPermission('player.warnings', 3
    , 'create'
    , 'update.any'
    , 'update.own'
    , 'delete.any'
    , 'delete.own'
    , 'view'
  )

  await attachPermission('player.reports', 2
    , 'comment.own'
    , 'comment.assigned'
    , 'comment.reported'
    , 'view.own'
    , 'view.assigned'
    , 'view.reported'
    , 'view.comments'
    , 'view.commands'
    , 'view.locations'
  )
  await attachPermission('player.reports', 3
    , 'update.state.any'
    , 'update.state.own'
    , 'update.assign.any'
    , 'update.assign.own'
    , 'comment.any'
    , 'comment.own'
    , 'comment.assigned'
    , 'comment.reported'
    , 'comment.delete.any'
    , 'comment.delete.own'
    , 'delete.any'
    , 'delete.assigned'
    , 'view.any'
    , 'view.own'
    , 'view.assigned'
    , 'view.reported'
    , 'view.serverlogs'
    , 'view.comments'
    , 'view.commands'
    , 'view.locations'
  )
}

exports.down = async function (db) {
  await db.runSql('TRUNCATE bm_web_resource_permissions')
  await db.runSql('TRUNCATE bm_web_player_server_roles')
  await db.runSql('TRUNCATE bm_web_player_roles')
  // Foreign key constraints
  await db.runSql('DELETE FROM bm_web_roles')
  await db.runSql('DELETE FROM bm_web_resources')
}

exports._meta = {
  version: 1
}
