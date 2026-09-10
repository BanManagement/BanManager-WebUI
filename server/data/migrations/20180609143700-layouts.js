const createLayoutHelper = require('./lib/layouts')

exports.up = async function (db) {
  const { addComponents } = createLayoutHelper(db)

  await db.createTable('bm_web_page_layouts', {
    columns: {
      id: { type: 'int', primaryKey: true, autoIncrement: true },
      pathname: 'string',
      device: 'string',
      component: 'string',
      x: 'int',
      y: 'int',
      w: 'int',
      textAlign: 'string',
      colour: 'string',
      meta: 'longtext'
    },
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  })
  await db.addIndex('bm_web_page_layouts', 'bm_web_page_layouts_pathname_idx', ['pathname'])

  await addComponents('player', [
    { component: 'PlayerHeader', x: 0, y: 0, w: 16, textAlign: 'center', colour: 'blue' },
    { component: 'PlayerPunishmentList', x: 0, y: 1, w: 16 },
    { component: 'PlayerIpList', x: 0, y: 2, w: 16 },
    { component: 'PlayerHistoryList', x: 0, y: 3, w: 16 },
    { component: 'PlayerAlts', x: 0, y: 4, w: 16 }
  ])
}

exports.down = async function (db) {
  await db.dropTable('bm_web_page_layouts')
}

exports._meta = {
  version: 1
}
