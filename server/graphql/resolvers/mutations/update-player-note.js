const udify = require('../../../data/udify')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function updatePlayerNote (obj, { id, serverId, input }, { state }) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError('Server does not exist')

  let data = await state.loaders.playerNote.serverDataId.load({ server: serverId, id })

  if (!data) throw new ExposedError(`Player note ${id} does not exist`)

  const updateData = { message: input.message }
  const table = server.config.tables.playerNotes

  await udify.update(server, table, updateData, { id })

  data = { ...data, ...updateData }

  return data
}
