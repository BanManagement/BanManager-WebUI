const { parse, unparse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')

// eslint-disable-next-line complexity
module.exports = async function listReports (obj, { actor, assigned, player, state: stateId, limit, offset }, { state }) {
  const filter = {}

  if (limit > 50) throw new ExposedError('Limit too large')
  if (!limit) limit = 10

  if (actor) filter['r.actor_id'] = parse(actor, Buffer.alloc(16))
  if (assigned) filter['r.assignee_id'] = parse(assigned, Buffer.alloc(16))
  if (player) filter['r.player_id'] = parse(player, Buffer.alloc(16))
  if (stateId) filter['r.state_id'] = stateId

  let totalQuery = `SELECT COUNT(*) AS total FROM
    ?? r
        LEFT JOIN
    ?? rps ON r.state_id = rps.id
        LEFT JOIN
    ?? a ON r.actor_id = a.id
        JOIN
    ?? p ON r.player_id = p.id
        LEFT JOIN
    ?? ap ON r.assignee_id = ap.id`
  let query = `SELECT
    r.id,
    r.reason,
    p.id AS player_id,
    p.name AS player_name,
    actor_id,
    a.name AS actor_name,
    assignee_id,
    ap.name AS assignee_name,
    created,
    updated,
    state_id,
    rps.name AS state_name
  FROM
    ?? r
        LEFT JOIN
    ?? rps ON r.state_id = rps.id
        LEFT JOIN
    ?? a ON r.actor_id = a.id
        JOIN
    ?? p ON r.player_id = p.id
        LEFT JOIN
    ?? ap ON r.assignee_id = ap.id`
  const filterKeys = Object.keys(filter)
  const filterValues = Object.values(filter)

  if (filterKeys.length) {
    const whereQuery = ' WHERE ' + filterKeys.map(key => {
      return `${key} = ?`
    }).join(' AND ')

    totalQuery += whereQuery
    query += whereQuery
  }

  query += ' LIMIT ?, ?'

  const data = { total: 0, reports: [] }

  // @TODO Clean up
  for (const server of state.serversPool.values()) {
    const tables = server.config.tables
    const actualQuery = query
      .replace('??', tables.playerReports)
      .replace('??', tables.playerReportStates)
      .replace('??', tables.players)
      .replace('??', tables.players)
      .replace('??', tables.players)
    const actualTotalQuery = totalQuery
      .replace('??', tables.playerReports)
      .replace('??', tables.playerReportStates)
      .replace('??', tables.players)
      .replace('??', tables.players)
      .replace('??', tables.players)

    const [[{ total }]] = await state.dbPool.execute(actualTotalQuery, filterValues)
    const [results] = await server.execute(actualQuery, [...filterValues, offset, limit])

    data.total += total

    data.reports = data.reports.concat(results.map(result => {
      const report = {
        id: result.id,
        reason: result.reason,
        created: result.created,
        updated: result.updated,
        player: {
          id: unparse(result.player_id),
          name: result.player_name
        },
        actor: {
          id: unparse(result.actor_id),
          name: result.actor_name
        },
        state: {
          id: result.state_id,
          name: result.state_name
        },
        server: server.config
      }

      if (result.assignee_id) {
        report.assignee = {
          id: unparse(result.assignee_id), name: result.assignee_name
        }
      }

      return report
    }))
  }

  return data
}
