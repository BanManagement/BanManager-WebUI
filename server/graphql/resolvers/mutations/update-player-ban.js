const udify = require('../../../data/udify')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function updatePlayerBan (obj, { id, serverId, input }, { state }) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError('Server does not exist')

  let data = await state.loaders.playerBan.serverDataId.load({ server: serverId, id })

  if (!data) throw new ExposedError(`Player ban ${id} does not exist`)

  const table = server.config.tables.playerBans
  const updateData = { expires: input.expires, reason: input.reason }

  await udify.update(server, table, updateData, { id })

  data = { ...data, ...updateData }

  return data
}
