const ExposedError = require('../../../data/exposed-error')

module.exports = async function reportStates (obj, { serverId }, { state }) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')

  const server = state.serversPool.get(serverId)
  const results = await server.pool(server.config.tables.playerReportStates).select('id', 'name')

  return results
}
