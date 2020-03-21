const udify = require('../../../data/udify')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function updatePlayerWarning (obj, { id, serverId, input }, { state }) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError('Server does not exist')

  let data = await state.loaders.playerWarning.serverDataId.load({ server: serverId, id })

  if (!data) throw new ExposedError(`Player warning ${id} does not exist`)

  const table = server.config.tables.playerWarnings
  const updateData = { points: input.points, expires: input.expires, reason: input.reason }

  await udify.update(server, table, updateData, { id })

  data = { ...data, ...updateData }

  return data
}
