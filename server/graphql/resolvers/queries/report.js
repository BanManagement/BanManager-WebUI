const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')

// eslint-disable-next-line complexity
module.exports = async function report (obj, { id, serverId }, { state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server not found')

  const server = state.serversPool.get(serverId)
  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, server, fields, 'playerReports')
    .where(`${server.config.tables.playerReports}.id`, id)

  let calculateAcl = false

  if (fields.fieldsByTypeName.PlayerReport.acl) {
    calculateAcl = true
    query.select('actor_id', 'player_id', 'assignee_id')
  }

  const [data] = await query.exec()

  if (!data) throw new ExposedError('Report not found')

  if (data && calculateAcl) {
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
