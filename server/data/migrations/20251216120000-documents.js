const aclHelper = require('./lib/acl')

exports.up = async function (db) {
  await db.createTable('bm_web_document_contents', {
    columns: {
      content_hash: { type: 'char', length: 64, notNull: true, primaryKey: true },
      path: { type: 'string', length: 255, notNull: true },
      mime_type: { type: 'string', length: 100, notNull: true },
      size: { type: 'int', unsigned: true, notNull: true },
      width: { type: 'smallint', unsigned: true, notNull: false },
      height: { type: 'smallint', unsigned: true, notNull: false }
    },
    charset: 'utf8'
  })

  await db.createTable('bm_web_documents', {
    columns: {
      id: { type: 'string', length: 36, notNull: true, primaryKey: true },
      player_id: { type: 'binary', length: 16, notNull: true },
      filename: { type: 'string', length: 255, notNull: true },
      content_hash: {
        type: 'char',
        length: 64,
        notNull: true,
        foreignKey: {
          name: 'bm_web_documents_content_hash_fk',
          table: 'bm_web_document_contents',
          mapping: 'content_hash',
          rules: {
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
          }
        }
      },
      created: { type: 'int', length: 10, unsigned: true, notNull: true }
    },
    charset: 'utf8'
  })

  await db.addIndex('bm_web_documents', 'bm_web_documents_player_idx', ['player_id'])
  await db.addIndex('bm_web_documents', 'bm_web_documents_created_idx', ['created'])
  await db.addIndex('bm_web_documents', 'bm_web_documents_content_hash_idx', ['content_hash'])

  await db.createTable('bm_web_appeal_documents', {
    columns: {
      appeal_id: {
        type: 'int',
        notNull: true,
        primaryKey: true,
        foreignKey: {
          name: 'bm_web_appeal_documents_appeal_id_fk',
          table: 'bm_web_appeals',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      },
      comment_id: {
        type: 'bigint',
        length: 20,
        notNull: true,
        primaryKey: true,
        defaultValue: 0
      },
      document_id: {
        type: 'string',
        length: 36,
        notNull: true,
        primaryKey: true,
        foreignKey: {
          name: 'bm_web_appeal_documents_document_id_fk',
          table: 'bm_web_documents',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      }
    },
    charset: 'utf8'
  })

  await db.createTable('bm_web_report_comment_documents', {
    columns: {
      server_id: {
        type: 'string',
        length: 255,
        notNull: true,
        primaryKey: true,
        foreignKey: {
          name: 'bm_web_report_comment_documents_server_id_fk',
          table: 'bm_web_servers',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      },
      comment_id: {
        type: 'bigint',
        length: 20,
        notNull: true,
        primaryKey: true
      },
      document_id: {
        type: 'string',
        length: 36,
        notNull: true,
        primaryKey: true,
        foreignKey: {
          name: 'bm_web_report_comment_documents_document_id_fk',
          table: 'bm_web_documents',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      }
    },
    charset: 'utf8'
  })

  const { addPermission, attachPermission } = aclHelper(db)

  await addPermission('player.appeals',
    'attachment.view',
    'attachment.create',
    'attachment.delete.own',
    'attachment.delete.any',
    'attachment.ratelimit.bypass'
  )

  await addPermission('player.reports',
    'attachment.view',
    'attachment.create',
    'attachment.delete.own',
    'attachment.delete.any',
    'attachment.ratelimit.bypass'
  )

  await attachPermission('player.appeals', 2, 'attachment.view')
  await attachPermission('player.reports', 2, 'attachment.view')

  await attachPermission('player.appeals', 3,
    'attachment.view',
    'attachment.create',
    'attachment.delete.own',
    'attachment.delete.any',
    'attachment.ratelimit.bypass'
  )

  await attachPermission('player.reports', 3,
    'attachment.view',
    'attachment.create',
    'attachment.delete.own',
    'attachment.delete.any',
    'attachment.ratelimit.bypass'
  )
}

exports.down = async function (db) {
  await db.dropTable('bm_web_report_comment_documents')
  await db.dropTable('bm_web_appeal_documents')
  await db.dropTable('bm_web_documents')
  await db.dropTable('bm_web_document_contents')
}

exports._meta = {
  version: 1
}
