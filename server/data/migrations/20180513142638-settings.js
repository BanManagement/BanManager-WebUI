exports.up = async function (db) {
  await db.createTable('bm_web_settings', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    name: 'string',
    value: 'string',
    permission: 'string'
  })

  // await db.insert('bm_web_settings', [ 'name', 'value' ], [ 'footer_name', 'Your Server Name' ])
  // await db.insert('bm_web_settings', [ 'name', 'value' ], [ 'homepage_name', 'Your Server Name' ])
}

exports.down = async function (db) {
  await db.dropTable('bm_web_settings')
}

exports._meta = {
  version: 1
}
