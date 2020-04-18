const playerMute = require('../queries/player-mute')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function updatePlayerMute (obj, { id, serverId, input }, { state }, info) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError('Server does not exist')

  let data = await playerMute(obj, { id, serverId }, { state }, info)

  if (!data) throw new ExposedError(`Player mute ${id} does not exist`)

  const table = server.config.tables.playerMutes
  const updateData = { soft: input.soft ? 1 : 0, expires: input.expires, reason: input.reason }

  await server.pool(table).update(updateData).where({ id })

  data = { ...data, ...updateData }

  return data
}
