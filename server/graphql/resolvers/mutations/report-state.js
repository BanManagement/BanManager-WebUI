const report = require('../queries/report')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function reportState (obj, { serverId, state: stateId, report: id }, { state }, info) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError('Server does not exist')

  const table = server.config.tables.playerReports
  const exists = await server.pool(table).where({ id })

  if (!exists) throw new ExposedError(`Report ${id} does not exist`)

  const row = await server.pool(server.config.tables.playerReportStates).where('id', stateId).first()

  if (!row) throw new ExposedError(`Report State ${stateId} does not exist`)

  await server.pool(table).update({ updated: 'UNIX_TIMESTAMP()', state_id: stateId }).where({ id })

  return report(obj, { id, serverId }, { state }, info)
}
