const { parse, unparse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')

// eslint-disable-next-line complexity
module.exports = async function listWarnings (obj, { serverId, actor, player, limit = 10, offset, order }, { state }) {
  const filter = {}

  if (limit > 50) throw new ExposedError('Limit too large')

  if (actor) filter['r.actor_id'] = parse(actor, Buffer.alloc(16))
  if (player) filter['r.player_id'] = parse(player, Buffer.alloc(16))

  let totalQuery = `SELECT COUNT(*) AS total FROM
    ?? r
        LEFT JOIN
    ?? a ON r.actor_id = a.id
        JOIN
    ?? p ON r.player_id = p.id`
  let query = `SELECT
    r.id,
    r.reason,
    p.id AS player_id,
    p.name AS player_name,
    actor_id,
    a.name AS actor_name,
    created
  FROM
    ?? r
        LEFT JOIN
    ?? a ON r.actor_id = a.id
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
    query += ' ORDER BY ' + order.replace('_', ' ')
  }

  query += ' LIMIT ?, ?'

  const data = { total: 0, records: [] }

  // @TODO Clean up
  for (const [id, server] of state.serversPool) {
    if (serverId && serverId !== id) continue

    const tables = server.config.tables
    const actualQuery = query
      .replace('??', tables.playerWarnings)
      .replace('??', tables.players)
      .replace('??', tables.players)
    const actualTotalQuery = totalQuery
      .replace('??', tables.playerWarnings)
      .replace('??', tables.players)
      .replace('??', tables.players)

    const [[{ total }]] = await state.dbPool.execute(actualTotalQuery, filterValues)
    const [results] = await server.execute(actualQuery, [...filterValues, offset, limit])

    data.total += total

    data.records = data.records.concat(results.map(result => {
      const acl = {
        update: state.acl.hasServerPermission(serverId, 'player.mutes', 'update.any') ||
        (state.acl.hasServerPermission(serverId, 'player.warnings', 'update.own') && state.acl.owns(result.actor_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.warnings', 'update.any')) ||
        (state.acl.hasServerPermission(serverId, 'player.warnings', 'update.own') && state.acl.owns(result.actor_id)),
        delete: state.acl.hasServerPermission(serverId, 'player.warnings', 'delete.any') ||
        (state.acl.hasServerPermission(serverId, 'player.warnings', 'delete.own') && state.acl.owns(result.actor_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.warnings', 'delete.any')) ||
        (state.acl.hasServerPermission(serverId, 'player.warnings', 'delete.own') && state.acl.owns(result.actor_id)),
        actor: state.acl.owns(result.actor_id),
        yours: state.acl.owns(result.player_id)
      }
      const record = {
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
        server: server.config,
        acl
      }

      return record
    }))
  }

  return data
}
