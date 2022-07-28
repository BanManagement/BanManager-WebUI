const report = require('../queries/report')
const ExposedError = require('../../../data/exposed-error')
const { getNotificationType } = require('../../../data/notification')
const { subscribeReport, notifyReport } = require('../../../data/notification/report')

module.exports = async function reportState (obj, { serverId, state: stateId, report: id }, { session, state }, info) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError('Server does not exist')

  const table = server.config.tables.playerReports
  const [data] = await server.pool(table).where({ id })

  if (!data) throw new ExposedError(`Report ${id} does not exist`)

  const canUpdate = state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.any') ||
    (state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.own') && state.acl.owns(data.actor_id)) ||
    (state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.assigned') && state.acl.owns(data.assignee_id)) ||
    (state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.reported') && state.acl.owns(data.player_id))

  if (!canUpdate) {
    throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')
  }

  const row = await server.pool(server.config.tables.playerReportStates).where('id', stateId).first()

  if (!row) throw new ExposedError(`Report State ${stateId} does not exist`)

  await subscribeReport(state.dbPool, id, serverId, session.playerId)
  await notifyReport(state.dbPool, getNotificationType('reportState'), id, server, null, session.playerId)

  await server.pool(table).update({ updated: server.pool.raw('UNIX_TIMESTAMP()'), state_id: stateId }).where({ id })

  return report(obj, { id, serverId }, { state }, info)
}
