const createLayoutHelper = require('./lib/layouts')

exports.up = async function (db) {
  await db.runSql('DELETE FROM bm_web_page_layouts WHERE pathname = "home"')
}

exports.down = async function (db) {
  const { addComponents } = createLayoutHelper(db)

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
}

exports._meta = {
  version: 1
}
