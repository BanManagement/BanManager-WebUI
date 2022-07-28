const ExposedError = require('../../../data/exposed-error')
const { subscribeReport, unsubscribeReport, getReportSubscription } = require('../../../data/notification/report')

module.exports = async function reportSubscriptionState (obj, { serverId, report: id, subscriptionState }, { session, state }, info) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError(`Server ${serverId} does not exist`)

  const data = await server.pool(server.config.tables.playerReports)
    .where({ id })
    .first()

  if (!data) throw new ExposedError(`Report ${id} does not exist`)

  const canView = state.acl.hasServerPermission(serverId, 'player.reports', 'view.any') ||
    (state.acl.hasServerPermission(serverId, 'player.reports', 'view.own') && state.acl.owns(data.actor_id)) ||
    (state.acl.hasServerPermission(serverId, 'player.reports', 'view.assigned') && state.acl.owns(data.assignee_id)) ||
    (state.acl.hasServerPermission(serverId, 'player.reports', 'view.reported') && state.acl.owns(data.player_id))

  if (!canView) throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')

  if (subscriptionState === 'SUBSCRIBED') {
    await subscribeReport(state.dbPool, id, serverId, session.playerId)
  } else {
    await unsubscribeReport(state.dbPool, id, serverId, session.playerId)
  }

  return getReportSubscription(state.dbPool, id, serverId, session.playerId)
}
