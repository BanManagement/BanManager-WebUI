const { unparse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')
const playerBan = require('../queries/player-ban')

module.exports = async function deletePlayerBan (obj, { id, serverId }, { session, state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server not found')

  const server = state.serversPool.get(serverId)
  const tables = server.config.tables
  const table = tables.playerBans
  const [result] = await server.pool(table)
    .select('actor_id')
    .where({ id })

  if (!result) throw new ExposedError('Ban not found')

  const canDelete = state.acl.hasServerPermission(serverId, 'player.bans', 'delete.any') ||
    (state.acl.hasServerPermission(serverId, 'player.bans', 'delete.own') && state.acl.owns(result.actor_id))

  if (!canDelete) {
    throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')
  }

  const data = await playerBan(obj, { id, serverId }, { state }, info)

  await server.pool.transaction(async trx => {
    const select = trx.select(
      'b.player_id',
      'b.reason',
      'b.expires',
      trx.raw('UNHEX(?)', unparse(session.playerId).replace(/-/g, '')),
      'b.actor_id',
      'b.created',
      trx.raw('UNIX_TIMESTAMP()'),
      trx.raw('?', 'WebUI'),
      'b.silent'
    )
      .from(`${table} as b`)
      .where('b.id', id)

    await trx(
      trx.raw(
        '?? (??, ??, ??, ??, ??, ??, ??, ??, ??)', [
          tables.playerBanRecords,
          'player_id',
          'reason',
          'expired',
          'actor_id',
          'pastActor_id',
          'pastCreated',
          'created',
          'createdReason',
          'silent'
        ]
      )
    ).insert(select)

    await trx(table).where({ id }).del()
  })

  return data
}
