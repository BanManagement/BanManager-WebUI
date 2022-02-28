const createLayoutHelper = require('./lib/layouts')

exports.up = async function (db) {
  const { addComponents } = createLayoutHelper(db)

  await db.removeColumn('bm_web_page_layouts', 'textAlign')
  await db.removeColumn('bm_web_page_layouts', 'colour')
  await db.addColumn('bm_web_page_layouts', 'h', { type: 'int', defaultValue: 1 })

  await db.runSql('DELETE FROM bm_web_page_layouts WHERE pathname = "home"')

  await addComponents('home', [
    { component: 'AppealPanel', x: 0, y: 0, w: 4, h: 1, meta: {}, device: 'desktop' },
    { component: 'SearchPanel', x: 4, y: 0, w: 4, h: 1, meta: {}, device: 'desktop' },
    { component: 'AccountPanel', x: 8, y: 0, w: 4, h: 1, meta: {}, device: 'desktop' },
    { component: 'StatisticsPanel', x: 0, y: 1, w: 12, h: 1, meta: {}, device: 'desktop' }
  ])

  await addComponents('home', [
    { component: 'AppealPanel', x: 0, y: 0, w: 12, h: 1, meta: {}, device: 'tablet' },
    { component: 'SearchPanel', x: 0, y: 1, w: 12, h: 1, meta: {}, device: 'tablet' },
    { component: 'AccountPanel', x: 0, y: 2, w: 12, h: 1, meta: {}, device: 'tablet' },
    { component: 'StatisticsPanel', x: 0, y: 3, w: 12, h: 1, meta: {}, device: 'tablet' }
  ])

  await addComponents('home', [
    { component: 'AppealPanel', x: 0, y: 0, w: 12, h: 1, meta: {}, device: 'mobile' },
    { component: 'SearchPanel', x: 0, y: 1, w: 12, h: 1, meta: {}, device: 'mobile' },
    { component: 'AccountPanel', x: 0, y: 2, w: 12, h: 1, meta: {}, device: 'mobile' },
    { component: 'StatisticsPanel', x: 0, y: 3, w: 12, h: 1, meta: {}, device: 'mobile' }
  ])

  await db.runSql('DELETE FROM bm_web_page_layouts WHERE pathname = "player"')
}

exports.down = async function (db) {
  const { addComponents } = createLayoutHelper(db)

  await db.removeColumn('bm_web_page_layouts', 'h')
  await db.addColumn('bm_web_page_layouts', 'textAlign', 'string')
  await db.addColumn('bm_web_page_layouts', 'colour', 'string')

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

  await db.runSql('DELETE FROM bm_web_page_layouts WHERE pathname = "home"')

  const [result] = await db.runSql('SELECT id FROM bm_web_servers LIMIT 1')

  if (!result || !result.id) return

  const id = result.id

  await addComponents('home', [{ component: 'ServerNameHeader', x: 0, y: 1, w: 16, meta: { serverId: id, as: 'h2' } }])
  await addComponents('home', [
    { component: 'RecentServerPunishments', x: 0, y: 2, w: 4, meta: { serverId: id, type: 'bans' }, device: 'desktop' },
    { component: 'RecentServerPunishments', x: 4, y: 2, w: 4, meta: { serverId: id, type: 'mutes' }, device: 'desktop' },
    { component: 'RecentServerPunishments', x: 8, y: 2, w: 4, meta: { serverId: id, type: 'reports' }, device: 'desktop' },
    { component: 'RecentServerPunishments', x: 12, y: 2, w: 4, meta: { serverId: id, type: 'warnings' }, device: 'desktop' }
  ])

  await addComponents('home', [
    { component: 'RecentServerPunishments', x: 0, y: 2, w: 4, meta: { serverId: id, type: 'bans' }, device: 'tablet' },
    { component: 'RecentServerPunishments', x: 4, y: 2, w: 4, meta: { serverId: id, type: 'mutes' }, device: 'tablet' },
    { component: 'RecentServerPunishments', x: 8, y: 2, w: 4, meta: { serverId: id, type: 'reports' }, device: 'tablet' },
    { component: 'RecentServerPunishments', x: 12, y: 2, w: 4, meta: { serverId: id, type: 'warnings' }, device: 'tablet' }
  ])

  await addComponents('home', [
    { component: 'RecentServerPunishments', x: 0, y: 2, w: 16, meta: { serverId: id, type: 'bans' }, device: 'mobile' },
    { component: 'RecentServerPunishments', x: 0, y: 3, w: 16, meta: { serverId: id, type: 'mutes' }, device: 'mobile' },
    { component: 'RecentServerPunishments', x: 0, y: 4, w: 16, meta: { serverId: id, type: 'reports' }, device: 'mobile' },
    { component: 'RecentServerPunishments', x: 0, y: 5, w: 16, meta: { serverId: id, type: 'warnings' }, device: 'mobile' }
  ])
}

exports._meta = {
  version: 1
}
