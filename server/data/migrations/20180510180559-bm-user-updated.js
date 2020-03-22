exports.up = async function (db) {
  await db.addColumn('bm_web_users', 'updated', { type: 'int', length: 10, notNull: true, defaultValue: Math.floor(Date.now() / 1000) })
}

exports.down = async function (db) {
  await db.removeColumn('bm_web_users', 'updated')
}

exports._meta = {
  version: 1
}
