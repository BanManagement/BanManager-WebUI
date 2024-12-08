exports.up = async function (db) {
  await db.createTable('bm_web_webhooks', {
    columns: {
      id: { type: 'bigint', length: 20, notNull: true, autoIncrement: true, primaryKey: true },
      url: { type: 'string', length: 255, notNull: true },
      type: { type: 'string', length: 255, notNull: true },
      template_type: { type: 'string', length: 255, notNull: true },
      content_type: { type: 'string', length: 255, notNull: true },
      content_template: { type: 'text', notNull: true },
      server_id: {
        type: 'string',
        notNull: false,
        foreignKey: {
          name: 'bm_web_webhooks_server_id_fk',
          table: 'bm_web_servers',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      },
      created: { type: 'bigint', unsigned: true, notNull: true },
      updated: { type: 'bigint', unsigned: true, notNull: true }
    },
    charset: 'utf8'
  })

  await db.addIndex('bm_web_webhooks', 'bm_web_webhooks_type_idx', ['type'])

  await db.createTable('bm_web_webhook_deliveries', {
    columns: {
      id: { type: 'bigint', length: 20, notNull: true, autoIncrement: true, primaryKey: true },
      webhook_id: {
        type: 'bigint',
        notNull: true,
        foreignKey: {
          name: 'bm_web_webhook_events_webhook_id_fk',
          table: 'bm_web_webhooks',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      },
      error: { type: 'json', notNull: false },
      content: { type: 'text', notNull: true },
      response: { type: 'json', notNull: true },
      created: { type: 'bigint', unsigned: true, notNull: true }
    },
    charset: 'utf8'
  })
}

exports.down = async function (db) {
  await db.dropTable('bm_web_webhook_deliveries')
  await db.dropTable('bm_web_webhooks')
}

exports._meta = {
  version: 1
}
