const ExposedError = require('../../../data/exposed-error')

module.exports = async function reportStates (obj, { serverId }, { state }) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server not found')

  const server = state.serversPool.get(serverId)
  const query = `SELECT id, name FROM ${server.config.tables.playerReportStates}`

  const [results] = await server.execute(query)

  return results
}
