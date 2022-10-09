exports.up = async function (db) {
  await db.createTable('bm_web_rate_limits', {
    columns: {
      key: { type: 'string', length: 255, notNull: true, characterSet: 'utf8', primaryKey: true },
      points: { type: 'int', length: 9, notNull: true, defaultValue: 0 },
      expire: { type: 'BIGINT', unsigned: true, notNull: false }
    },
    charset: 'utf8'
  })
}

exports.down = async function (db) {
  await db.dropTable('bm_web_rate_limits')
}

exports._meta = {
  version: 1
}
