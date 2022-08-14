const eachDayOfInterval = require('date-fns/eachDayOfInterval')
const subDays = require('date-fns/subDays')
const getUnixTime = require('date-fns/getUnixTime')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function serverWarningStats (obj, { id, intervalDays }, { state: { serversPool }, log }) {
  if (!serversPool.has(id)) throw new ExposedError('Server not found')
  if (intervalDays > 90) throw new ExposedError('Maximum 90 intervalDays allowed')

  const start = subDays(new Date(), intervalDays)
  const startUnixTime = getUnixTime(start)
  const { config, pool } = serversPool.get(id)

  const { total } = await pool(config.tables.playerWarnings)
    .select(pool.raw('COUNT(*) AS `total`'))
    .where('created', '>=', startUnixTime)
    .first()
  const { averageLength } = await pool(config.tables.playerWarnings)
    .select(pool.raw('FLOOR(SUM(expires - created) / COUNT(*)) AS averageLength'))
    .where('created', '>=', startUnixTime)
    .whereNot('expires', 0)
    .first()
  const totalHistoryValues = await pool(config.tables.playerWarnings)
    .select(pool.raw('COUNT(*) AS value, DATE(FROM_UNIXTIME(created)) AS date'))
    .where('created', '>=', startUnixTime)
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
    total,
    averageLength,
    totalHistory: totalHistory.map(date => ({
      date: getUnixTime(date),
      value: totalHistoryLookup[getUnixTime(date)] || 0
    }))
  }
}
