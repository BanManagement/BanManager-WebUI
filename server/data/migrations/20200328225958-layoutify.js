const createLayoutHelper = require('./lib/layouts')

exports.up = async function (db) {
  const { addComponents } = createLayoutHelper(db)

  await addComponents('home', [{
    component: 'SearchBox',
    x: 0,
    y: 0,
    w: 16,
    textAlign: 'center',
    colour: 'blue',
    meta: {
      name: 'Your Network Here',
      iconSrc: '/images/banmanager-icon.png',
      showPlayerSearch: true,
      showIpSearch: true
    }
  }])

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

exports.down = async function (db) {
  await db.runSql('DELETE FROM bm_web_page_layouts WHERE pathname = \'home\'')
}

exports._meta = {
  version: 1
}
