const aclHelper = require('./lib/acl')

exports.up = async function (db) {
  await db.createTable('bm_web_appeal_states', {
    columns: {
      id: { type: 'int', notNull: true, primaryKey: true, autoIncrement: true },
      name: { type: 'string', notNull: true }
    },
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
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
      punishment_reason: { type: 'string', notNull: true },
      punishment_created: { type: 'int', length: 10, notNull: true },
      punishment_expires: { type: 'int', length: 10, notNull: true },
      punishment_points: { type: 'decimal(60,2)' },
      punishment_soft: { type: 'tinyint', length: 1 },
      punishment_actor_id: { type: 'binary', length: 16, notNull: true },
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
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  })

  await db.addIndex('bm_web_appeals', 'bm_web_appeals_server_idx', ['server_id'])
  await db.addIndex('bm_web_appeals', 'bm_web_appeals_actor_idx', ['actor_id'])
  await db.addIndex('bm_web_appeals', 'bm_web_appeals_punishment_actor_idx', ['punishment_actor_id'])

  await db.insert('bm_web_appeal_states', ['id', 'name'], [1, 'Open'])
  await db.insert('bm_web_appeal_states', ['id', 'name'], [2, 'Assigned'])
  await db.insert('bm_web_appeal_states', ['id', 'name'], [3, 'Resolved'])
  await db.insert('bm_web_appeal_states', ['id', 'name'], [4, 'Rejected'])

  await db.createTable('bm_web_appeal_comments', {
    columns: {
      id: { type: 'bigint', length: 20, notNull: true, primaryKey: true, autoIncrement: true },
      type: { type: 'int', length: 11, notNull: true },
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
      assignee_id: { type: 'binary', length: 16, notNull: false },
      state_id: {
        type: 'int',
        notNull: false,
        foreignKey: {
          name: 'bm_web_appeal_comments_state_id_fk',
          table: 'bm_web_appeal_states',
          mapping: 'id',
          rules: {
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
          }
        }
      },
      old_reason: { type: 'string' },
      new_reason: { type: 'string' },
      old_expires: { type: 'int', length: 10 },
      new_expires: { type: 'int', length: 10 },
      old_points: { type: 'decimal(60,2)' },
      new_points: { type: 'decimal(60,2)' },
      old_soft: { type: 'tinyint', length: 1 },
      new_soft: { type: 'tinyint', length: 1 },
      content: { type: 'string' },
      created: { type: 'int', length: 10, notNull: true },
      updated: { type: 'int', length: 10, notNull: true }
    },
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
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
