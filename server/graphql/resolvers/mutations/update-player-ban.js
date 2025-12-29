const playerBan = require('../queries/player-ban')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function updatePlayerBan (obj, { id, serverId, input }, { state }, info) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError('Server does not exist')

  const data = await playerBan(obj, { id, serverId }, { state }, info)

  if (!data) throw new ExposedError(`Player ban ${id} does not exist`)

  const table = server.config.tables.playerBans

  await server.pool(table).update({
    expires: input.expires,
    reason: input.reason,
    updated: server.pool.raw('UNIX_TIMESTAMP()')
  }).where({ id })

  return playerBan(obj, { id, serverId }, { state }, info)
}
