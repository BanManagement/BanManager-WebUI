const PlayerNote = require('../queries/player-note')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function updatePlayerNote (obj, { id, serverId, input }, { state }, info) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError('Server does not exist')

  let data = await PlayerNote(obj, { id, serverId }, { state }, info)

  if (!data) throw new ExposedError(`Player note ${id} does not exist`)

  const updateData = { message: input.message }
  const table = server.config.tables.playerNotes

  await server.pool(table).update(updateData).where({ id })

  data = { ...data, ...updateData }

  return data
}
