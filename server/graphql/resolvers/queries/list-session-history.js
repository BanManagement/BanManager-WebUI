const ExposedError = require('../../../data/exposed-error')

// eslint-disable-next-line complexity
module.exports = async function listPlayerSessionHistory (obj, { serverId, player, limit = 10, offset, order = 'leave_DESC' }, { state }) {
  const filter = {}

  if (!state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')
  if (limit > 50) throw new ExposedError('Limit too large')

  if (player) filter['r.player_id'] = player

  let totalQuery = `SELECT COUNT(*) AS total FROM
    ?? r
        JOIN
    ?? p ON r.player_id = p.id`
  let query = `SELECT
    r.id,
    r.ip,
    r.join,
    r.leave,
    p.id AS player_id,
    p.name AS player_name
  FROM
    ?? r
        JOIN
    ?? p ON r.player_id = p.id`
  const filterKeys = Object.keys(filter)
  const filterValues = Object.values(filter)

  if (filterKeys.length) {
    const whereQuery = ' WHERE ' + filterKeys.map(key => {
      return `${key} = ?`
    }).join(' AND ')

    totalQuery += whereQuery
    query += whereQuery
  }

  if (order) {
    const [col, type] = order.split('_')

    query += ` ORDER BY \`${col}\` ${type}`
  }

  query += ' LIMIT ?, ?'

  const server = state.serversPool.get(serverId)
  const tables = server.config.tables
  const actualQuery = query
    .replace('??', tables.playerHistory)
    .replace('??', tables.players)
  const actualTotalQuery = totalQuery
    .replace('??', tables.playerHistory)
    .replace('??', tables.players)
  const [[{ total }]] = await state.dbPool.execute(actualTotalQuery, filterValues)
  const [results] = await server.execute(actualQuery, [...filterValues, offset, limit])

  const data = {
    total,
    records: results.map(result => ({
      id: result.id,
      ip: result.ip,
      join: result.join,
      leave: result.leave,
      player: {
        id: result.player_id,
        name: result.player_name
      },
      server: server.config
    }))
  }

  return data
}
