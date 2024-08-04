exports.up = async function (db) {
  await db.createTable('bm_web_notification_subscriptions', {
    columns: {
      id: { type: 'bigint', length: 20, notNull: true, autoIncrement: true, primaryKey: true },
      player_id: { type: 'binary', length: 16, notNull: true },
      endpoint: { type: 'text', length: 65535, notNull: true },
      expiration: { type: 'BIGINT', unsigned: true, notNull: false },
      auth: { type: 'string', length: 255, notNull: true },
      p256dh: { type: 'string', length: 255, notNull: true },
      created: { type: 'int', length: 10, notNull: true }
    },
    charset: 'utf8'
  })

  await db.addIndex('bm_web_notification_subscriptions', 'bm_web_notification_subscriptions_player_idx', ['player_id'])
}

exports.down = async function (db) {
  await db.dropTable('bm_web_notification_subscriptions')
}

exports._meta = {
  version: 1
}
