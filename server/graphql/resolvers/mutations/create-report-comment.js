const ExposedError = require('../../../data/exposed-error')

module.exports = async function createReportComment (obj, { report: reportId, serverId, input }, { session, state }) {
  const server = state.serversPool.get(serverId)
  const table = server.config.tables.playerReportComments
  const actor = session.playerId

  const report = await state.loaders.report.serverDataId.load({ server: serverId, id: reportId })

  if (!report) throw new ExposedError('Report does not exist')

  const [result] = await server.query(
    `INSERT INTO ${table}
      (report_id, actor_id, comment, created, updated)
        VALUES
      (?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())`
    , [reportId, actor, input.message])
  const id = result.insertId

  const data = await state.loaders.reportComment.serverDataId.load({ serverId, id })

  return data
}
