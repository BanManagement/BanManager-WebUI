const eachDayOfInterval = require('date-fns/eachDayOfInterval')
const subDays = require('date-fns/subDays')
const getUnixTime = require('date-fns/getUnixTime')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function serverBanStats (obj, { id, intervalDays }, { state: { serversPool }, log }) {
  if (!serversPool.has(id)) throw new ExposedError('Server not found')
  if (intervalDays > 90) throw new ExposedError('Maximum 90 intervalDays allowed')

  const start = subDays(new Date(), intervalDays)
  const startUnixTime = getUnixTime(start)
  const { config, pool } = serversPool.get(id)

  const { totalActiveBans } = await pool(config.tables.playerBans)
    .select(pool.raw('COUNT(*) AS `totalActiveBans`'))
    .where('created', '>=', startUnixTime)
    .first()
  const { totalBans } = await pool(config.tables.playerBanRecords)
    .select(pool.raw('COUNT(*) AS `totalBans`'))
    .where('pastCreated', '>=', startUnixTime)
    .first()
  const { averageLength } = await pool
    .select(pool.raw('FLOOR(SUM(t.expires - t.created) / COUNT(*)) AS averageLength'))
    .from(function () {
      this
        .select('expires', 'created')
        .from(config.tables.playerBans)
        .whereNot('expires', 0)
        .where('created', '>=', startUnixTime)
        .unionAll(function () {
          this
            .select('created AS expires', 'pastCreated AS created')
            .from(config.tables.playerBanRecords)
            .where('pastCreated', '>=', startUnixTime)
        })
        .as('t')
    })
    .first()
  const totalHistoryValues = await pool
    .select(pool.raw('COUNT(*) AS value, DATE(FROM_UNIXTIME(t.created)) AS date'))
    .from(function () {
      this
        .select('created')
        .from(config.tables.playerBans)
        .where('created', '>=', startUnixTime)
        .unionAll(function () {
          this
            .select('pastCreated AS created')
            .from(config.tables.playerBanRecords)
            .where('pastCreated', '>=', startUnixTime)
        })
        .as('t')
    })
    .groupBy('date')
    .orderBy('date', 'ASC')
  const totalHistoryLookup = totalHistoryValues.reduce((acc, row) => {
    acc[getUnixTime(row.date)] = row.value

    return acc
  }, {})
  const totalHistory = eachDayOfInterval({
    start,
    end: new Date()
  })

  return {
    total: totalActiveBans + totalBans,
    averageLength,
    totalHistory: totalHistory.map(date => ({
      date: getUnixTime(date),
      value: totalHistoryLookup[getUnixTime(date)] || 0
    }))
  }
}
