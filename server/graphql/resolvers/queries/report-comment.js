const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function reportComment (obj, { id, serverId }, { state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server not found')

  const server = state.serversPool.get(serverId)

  const table = server.config.tables.playerReportComments
  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, server, fields, 'playerReportComments')
    .select('report_id')
    .where(`${table}.id`, id)

  let calculateAcl = false

  if (fields.fieldsByTypeName.PlayerReportComment.acl) {
    calculateAcl = true
    query.select(['actor_id'].map(f => `${table}.${f}`))
  }

  const [data] = await query.exec()

  if (!data) throw new ExposedError('Report comment not found')

  if (!state.acl.hasServerPermission(serverId, 'player.reports', 'view.any')) {
    // We need to perform some permission checks
    const [aclCheck] = await server.pool(server.config.tables.playerReports)
      .select('actor_id', 'player_id', 'assignee_id')
      .where({ id: data.report_id })

    if (!aclCheck) throw new ExposedError('Report not found')

    const canView = (state.acl.hasServerPermission(serverId, 'player.reports', 'view.own') && state.acl.owns(aclCheck.actor_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.reports', 'view.assigned') && state.acl.owns(aclCheck.assignee_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.reports', 'view.reported') && state.acl.owns(aclCheck.player_id))

    if (!canView) {
      throw new ExposedError(
        'You do not have permission to perform this action, please contact your server administrator')
    }
  }

  if (data && calculateAcl) {
    data.acl = {
      delete: state.acl.hasServerPermission(serverId, 'player.reports', 'comment.delete.any') ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.delete.own') && state.acl.owns(data.actor_id))
    }
  }

  return data
}
