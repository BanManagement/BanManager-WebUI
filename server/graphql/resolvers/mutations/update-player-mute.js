const playerMute = require('../queries/player-mute')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function updatePlayerMute (obj, { id, serverId, input }, { state }, info) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError('Server does not exist')

  const data = await playerMute(obj, { id, serverId }, { state }, info)

  if (!data) throw new ExposedError(`Player mute ${id} does not exist`)

  const table = server.config.tables.playerMutes

  await server.pool(table).update({
    soft: input.soft ? 1 : 0,
    expires: input.expires,
    reason: input.reason,
    updated: server.pool.raw('UNIX_TIMESTAMP()')
  }).where({ id })

  return playerMute(obj, { id, serverId }, { state }, info)
}
