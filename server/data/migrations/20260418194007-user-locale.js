exports.up = async function (db) {
  await db.addColumn('bm_web_users', 'locale', { type: 'string', length: 10, notNull: false, defaultValue: null })
}

exports.down = async function (db) {
  await db.removeColumn('bm_web_users', 'locale')
}

exports._meta = {
  version: 1
}
