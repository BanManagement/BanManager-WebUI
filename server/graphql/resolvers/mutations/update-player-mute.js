const udify = require('../../../data/udify')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function updatePlayerMute (obj, { id, serverId, input }, { state }) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError('Server does not exist')

  let data = await state.loaders.playerMute.serverDataId.load({ server: serverId, id })

  if (!data) throw new ExposedError(`Player mute ${id} does not exist`)

  const table = server.config.tables.playerMutes
  const updateData = { soft: input.soft ? 1 : 0, expires: input.expires, reason: input.reason }

  await udify.update(server, table, updateData, { id })

  data = { ...data, ...updateData }

  return data
}
