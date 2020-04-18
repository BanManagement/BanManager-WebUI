const playerWarning = require('../queries/player-warning')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function updatePlayerWarning (obj, { id, serverId, input }, { state }, info) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError('Server does not exist')

  let data = await playerWarning(obj, { id, serverId }, { state }, info)

  if (!data) throw new ExposedError(`Player warning ${id} does not exist`)

  const table = server.config.tables.playerWarnings
  const updateData = { points: input.points, expires: input.expires, reason: input.reason }

  await server.pool(table).update(updateData).where({ id })

  data = { ...data, ...updateData }

  return data
}
