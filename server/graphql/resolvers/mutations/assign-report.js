const { unparse } = require('uuid-parse')
const report = require('../queries/report')
const ExposedError = require('../../../data/exposed-error')
const { getNotificationType } = require('../../../data/notification')
const { subscribeReport, notifyReport } = require('../../../data/notification/report')

module.exports = async function assignReport (obj, { serverId, player, report: id }, { session, state }, info) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError(`Server ${serverId} does not exist`, 'SERVER_NOT_FOUND')

  const data = await server.pool(server.config.tables.playerReports)
    .where({ id })
    .first()

  if (!data) throw new ExposedError(`Report ${id} does not exist`, 'REPORT_NOT_FOUND')

  const hasPermission = state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.any') ||
      (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.assigned') && state.acl.owns(data.assignee_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.reported') && state.acl.owns(data.player_id))

  if (!hasPermission) throw new ExposedError('You do not have permission to perform this action, please contact your server administrator', 'NO_PERMISSION')
  if (data.actor_id.equals(player)) throw new ExposedError('You cannot assign a report to the player which created it', 'INVALID_TARGET')

  const playerData = await server.pool(server.config.tables.players)
    .select('id')
    .where('id', player)
    .first()

  if (!playerData) throw new ExposedError(`Player ${unparse(player)} does not exist`, 'PLAYER_NOT_FOUND')

  await server.pool(server.config.tables.playerReports)
    .update({
      updated: server.pool.raw('UNIX_TIMESTAMP()'),
      state_id: 2,
      assignee_id: player
    })
    .where({ id })

  await subscribeReport(state.dbPool, id, serverId, session.playerId)
  await subscribeReport(state.dbPool, id, serverId, player)
  await notifyReport(state.dbPool, getNotificationType('reportAssigned'), id, server, null, session.playerId, state)

  return report(obj, { id, serverId }, { state }, info)
}
