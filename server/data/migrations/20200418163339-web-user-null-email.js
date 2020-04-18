exports.up = async function (db) {
  await db.changeColumn('bm_web_users', 'email', { type: 'varchar', length: 255, notNull: false, defaultValue: null })
}

exports.down = async function (db) {
  await db.changeColumn('bm_web_users', 'email', { type: 'varchar', length: 255, notNull: true })
}

exports._meta = {
  version: 1
}
