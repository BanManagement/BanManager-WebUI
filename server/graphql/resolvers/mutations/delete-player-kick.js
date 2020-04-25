const ExposedError = require('../../../data/exposed-error')
const playerKick = require('../queries/player-kick')

module.exports = async function deletePlayerKick (obj, { id, serverId }, { session, state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server not found')

  const server = state.serversPool.get(serverId)
  const tables = server.config.tables
  const table = tables.playerKicks
  const [result] = await server.pool(table)
    .select('actor_id')
    .where({ id })

  if (!result) throw new ExposedError('Kick not found')

  const canDelete = state.acl.hasServerPermission(serverId, 'player.kicks', 'delete.any') ||
    (state.acl.hasServerPermission(serverId, 'player.kicks', 'delete.own') && state.acl.owns(result.actor_id))

  if (!canDelete) {
    throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')
  }

  const data = await playerKick(obj, { id, serverId }, { state }, info)

  await server.pool(table).where({ id }).del()

  return data
}
