const createLayoutHelper = require('./lib/layouts')

exports.up = async function (db) {
  const { addComponents } = createLayoutHelper(db)

  await db.runSql('DELETE FROM bm_web_page_layouts WHERE pathname = "player"')

  await addComponents('player', [
    { component: 'PlayerHeader', x: 0, y: 0, w: 16, textAlign: 'center', colour: 'blue' },
    { component: 'ActivePlayerBans', x: 0, y: 1, w: 16 },
    { component: 'ActivePlayerMutes', x: 0, y: 2, w: 16 },
    { component: 'PlayerPunishmentRecords', x: 0, y: 3, w: 16 },
    { component: 'PlayerIpList', x: 0, y: 4, w: 16 },
    { component: 'PlayerHistoryList', x: 0, y: 5, w: 16 },
    { component: 'PlayerAlts', x: 0, y: 6, w: 16 }
  ])
}

exports.down = async function (db) {
  const { addComponents } = createLayoutHelper(db)

  await db.runSql('DELETE FROM bm_web_page_layouts WHERE pathname = "player"')

  await addComponents('player', [
    { component: 'PlayerHeader', x: 0, y: 0, w: 16, textAlign: 'center', colour: 'blue' },
    { component: 'PlayerPunishmentList', x: 0, y: 1, w: 16 },
    { component: 'PlayerIpList', x: 0, y: 2, w: 16 },
    { component: 'PlayerHistoryList', x: 0, y: 3, w: 16 },
    { component: 'PlayerAlts', x: 0, y: 4, w: 16 }
  ])
}

exports._meta = {
  version: 1
}
