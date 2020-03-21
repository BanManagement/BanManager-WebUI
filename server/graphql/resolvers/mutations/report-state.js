const udify = require('../../../data/udify')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function reportState (obj, { serverId, state: stateId, report: id }, { state }) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError('Server does not exist')

  const table = server.config.tables.playerReports
  let report = await state.loaders.report.serverDataId.load({ server: serverId, id })

  if (!report) throw new ExposedError(`Report ${id} does not exist`)

  const [[row]] = await server.query(`SELECT id FROM ${server.config.tables.playerReportStates} WHERE id = ?`
    , [stateId])

  if (!row) throw new ExposedError(`Report State ${stateId} does not exist`)

  await udify.update(server, table,
    { updated: 'UNIX_TIMESTAMP()', state_id: stateId }, { id })

  report = await state.loaders.report.serverDataId.load({ server: serverId, id })

  return report
}
