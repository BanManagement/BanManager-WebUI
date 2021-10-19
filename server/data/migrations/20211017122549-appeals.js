const aclHelper = require('./lib/acl')

exports.up = async function (db) {
  await db.createTable('bm_web_appeal_states', {
    id: { type: 'int', notNull: true, primaryKey: true, autoIncrement: true },
    name: { type: 'string', notNull: true }
  })
  await db.createTable('bm_web_appeals', {
    columns: {
      id: { type: 'int', notNull: true, primaryKey: true, autoIncrement: true },
      server_id: {
        type: 'string',
        notNull: true,
        foreignKey: {
          name: 'bm_web_appeals_server_id_fk',
          table: 'bm_web_servers',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      },
      actor_id: { type: 'binary', length: 16, notNull: true },
      assignee_id: { type: 'binary', length: 16, notNull: false },
      punishment_id: { type: 'int', notNull: true },
      punishment_type: { type: 'string', notNull: true },
      state_id: {
        type: 'int',
        notNull: true,
        foreignKey: {
          name: 'bm_web_appeals_state_id_fk',
          table: 'bm_web_appeal_states',
          mapping: 'id',
          rules: {
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
          }
        }
      },
      created: { type: 'int', length: 10, notNull: true },
      updated: { type: 'int', length: 10, notNull: true },
      reason: { type: 'text', notNull: true }
    },
    charset: 'utf8'
  })

  await db.addIndex('bm_web_appeals', 'bm_web_appeals_server_idx', ['server_id'])
  await db.addIndex('bm_web_appeals', 'bm_web_appeals_actor_idx', ['actor_id'])

  await db.insert('bm_web_appeal_states', ['id', 'name'], [1, 'Open'])
  await db.insert('bm_web_appeal_states', ['id', 'name'], [2, 'Assigned'])
  await db.insert('bm_web_appeal_states', ['id', 'name'], [3, 'Resolved'])
  await db.insert('bm_web_appeal_states', ['id', 'name'], [4, 'Rejected'])

  await db.createTable('bm_web_appeal_comments', {
    columns: {
      id: { type: 'int', notNull: true, primaryKey: true, autoIncrement: true },
      appeal_id: {
        type: 'int',
        notNull: true,
        foreignKey: {
          name: 'bm_web_appeal_comments_appeal_id_fk',
          table: 'bm_web_appeals',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      },
      actor_id: { type: 'binary', length: 16, notNull: true },
      comment: { type: 'string', notNull: true },
      created: { type: 'int', length: 10, notNull: true },
      updated: { type: 'int', length: 10, notNull: true }
    },
    charset: 'utf8'
  })

  const { addResource, addPermission, attachPermission } = aclHelper(db)

  await addResource('player.appeals')
  await addPermission('player.appeals'
    , 'update.state.any'
    , 'update.state.own'
    , 'update.state.assigned'
    , 'update.assign.any'
    , 'update.assign.own'
    , 'update.assign.assigned'
    , 'comment.any'
    , 'comment.own'
    , 'comment.assigned'
    , 'comment.delete.any'
    , 'comment.delete.own'
    , 'delete.any'
    , 'delete.assigned'
    , 'view.any'
    , 'view.own'
    , 'view.assigned'
    , 'view.comments'
    , 'create.any'
    , 'create.ban'
    , 'create.kick'
    , 'create.mute'
    , 'create.warning'
  )
  await attachPermission('player.appeals', 2
    , 'comment.own'
    , 'comment.assigned'
    , 'view.own'
    , 'view.assigned'
    , 'view.comments'
    , 'create.ban'
    , 'create.kick'
    , 'create.mute'
    , 'create.warning'
  )
  await attachPermission('player.appeals', 3
    , 'update.state.any'
    , 'update.state.own'
    , 'update.assign.any'
    , 'update.assign.own'
    , 'comment.any'
    , 'comment.own'
    , 'comment.assigned'
    , 'comment.delete.any'
    , 'comment.delete.own'
    , 'delete.any'
    , 'delete.assigned'
    , 'view.any'
    , 'view.own'
    , 'view.assigned'
    , 'view.comments'
    , 'create.any'
  )
}

exports.down = async function (db) {
  await db.dropTable('bm_web_appeal_comments')
  await db.dropTable('bm_web_appeals')
  await db.dropTable('bm_web_appeal_states')

  const { removeResource } = aclHelper(db)

  await removeResource('player.appeals')
}

exports._meta = {
  version: 1
}
