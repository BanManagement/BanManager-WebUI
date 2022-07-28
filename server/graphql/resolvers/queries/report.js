const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')
const { getReportSubscription } = require('../../../data/notification/report')

// eslint-disable-next-line complexity
module.exports = async function report (obj, { id, serverId }, { session, state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server not found')

  const server = state.serversPool.get(serverId)
  const table = server.config.tables.playerReports

  if (!state.acl.hasServerPermission(serverId, 'player.reports', 'view.any')) {
    // We need to perform some permission checks
    const [aclCheck] = await server.pool(table)
      .select('actor_id', 'player_id', 'assignee_id')
      .where({ id })

    if (!aclCheck) throw new ExposedError('Report not found')

    const canView = (state.acl.hasServerPermission(serverId, 'player.reports', 'view.own') && state.acl.owns(aclCheck.actor_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.reports', 'view.assigned') && state.acl.owns(aclCheck.assignee_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.reports', 'view.reported') && state.acl.owns(aclCheck.player_id))

    if (!canView) {
      throw new ExposedError(
        'You do not have permission to perform this action, please contact your server administrator')
    }
  }

  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, server, fields, 'playerReports')
    .where(`${table}.id`, id)

  let calculateAcl = false

  if (fields.fieldsByTypeName.PlayerReport.acl) {
    calculateAcl = true
    query.select(['actor_id', 'player_id', 'assignee_id'].map(f => `${table}.${f}`))
  }

  const [data] = await query.exec()

  if (!data) throw new ExposedError('Report not found')

  if (fields.fieldsByTypeName.PlayerReport.viewerSubscription && session?.playerId) {
    data.viewerSubscription = await getReportSubscription(state.dbPool, id, serverId, session.playerId)
  }

  if (calculateAcl) {
    data.acl = {
      comment: state.acl.hasServerPermission(serverId, 'player.reports', 'comment.any') ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.own') && state.acl.owns(data.actor_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.assigned') && state.acl.owns(data.assignee_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.reported') && state.acl.owns(data.player_id)),
      assign: state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.any') ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.own') && state.acl.owns(data.actor_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.assigned') && state.acl.owns(data.assignee_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.reported') && state.acl.owns(data.player_id)),
      state: state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.any') ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.own') && state.acl.owns(data.actor_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.assigned') && state.acl.owns(data.assignee_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.reported') && state.acl.owns(data.player_id)),
      delete: state.acl.hasServerPermission(serverId, 'player.reports', 'delete.any') ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'delete.assigned') && state.acl.owns(data.assignee_id))
    }
  }

  return data
}
