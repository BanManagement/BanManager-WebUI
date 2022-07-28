exports.up = async function (db) {
  await db.createTable('bm_web_notifications', {
    columns: {
      id: { type: 'string', length: 255, notNull: true, primaryKey: true },
      type: { type: 'int', length: 11, notNull: true },
      appeal_id: {
        type: 'int',
        notNull: false,
        foreignKey: {
          name: 'bm_web_notifications_appeal_appeal_id_fk',
          table: 'bm_web_appeals',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      },
      report_id: { type: 'int', length: 11, notNull: false },
      state_id: { type: 'int', notNull: true },
      comment_id: { type: 'int', length: 11, notNull: false },
      server_id: {
        type: 'string',
        notNull: false,
        foreignKey: {
          name: 'bm_web_notifications_server_id_fk',
          table: 'bm_web_servers',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      },
      player_id: { type: 'binary', length: 16, notNull: true },
      actor_id: { type: 'binary', length: 16, notNull: false },
      created: { type: 'int', length: 10, notNull: true },
      updated: { type: 'int', length: 10, notNull: true }
    },
    charset: 'utf8'
  })

  await db.addIndex('bm_web_notifications', 'bm_web_notifications_player_idx', ['player_id'])

  await db.createTable('bm_web_report_watchers', {
    columns: {
      id: { type: 'bigint', length: 20, notNull: true, primaryKey: true, autoIncrement: true },
      report_id: { type: 'int', length: 11, notNull: false },
      server_id: {
        type: 'string',
        notNull: true,
        foreignKey: {
          name: 'bm_web_report_watchers_server_id_fk',
          table: 'bm_web_servers',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      },
      player_id: { type: 'binary', length: 16, notNull: true },
      is_watching: { type: 'tinyint', length: 1, notNull: true },
      created: { type: 'int', length: 10, notNull: true },
      updated: { type: 'int', length: 10, notNull: true }
    },
    charset: 'utf8'
  })

  await db.addIndex('bm_web_report_watchers', 'bm_web_report_watchers_report_server_player_idx', ['report_id', 'server_id', 'player_id'], true)

  await db.createTable('bm_web_appeal_watchers', {
    columns: {
      id: { type: 'bigint', length: 20, notNull: true, primaryKey: true, autoIncrement: true },
      appeal_id: {
        type: 'int',
        notNull: true,
        foreignKey: {
          name: 'bm_web_appeal_watchers_appeal_id_fk',
          table: 'bm_web_appeals',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      },
      player_id: { type: 'binary', length: 16, notNull: true },
      is_watching: { type: 'tinyint', length: 1, notNull: true },
      created: { type: 'int', length: 10, notNull: true },
      updated: { type: 'int', length: 10, notNull: true }
    },
    charset: 'utf8'
  })

  await db.addIndex('bm_web_appeal_watchers', 'bm_web_appeal_watchers_appeal_player_idx', ['appeal_id', 'player_id'], true)
}

exports.down = async function (db) {
  await db.dropTable('bm_web_notifications')
  await db.dropTable('bm_web_appeal_watchers')
  await db.dropTable('bm_web_report_watchers')
}

exports._meta = {
  version: 1
}
