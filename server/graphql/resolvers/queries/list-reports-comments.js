const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')
const viewPerms = [
  ['view.own', 'actor_id'],
  ['view.assigned', 'assignee_id'],
  ['view.reported', 'player_id']
]

module.exports = async function listPlayerReportComments (obj, { serverId, report, actor, order }, { session, state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')
  if (!state.acl.hasServerPermission(serverId, 'player.reports', 'view.any')) {
    if (!session || !session.playerId) return { total: 0, records: [] }

    const deny = viewPerms.every(([perm]) => state.acl.hasServerPermission(serverId, 'player.reports', perm) === false)

    if (deny) return { total: 0, records: [] }
  }

  const server = state.serversPool.get(serverId)
  const tables = server.config.tables
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)
  const data = {}
  const filter = { report_id: report }

  if (actor) filter.actor_id = actor

  if (fields.total) {
    const { total } = await server.pool(tables.playerReportComments)
      .select(server.pool.raw('COUNT(*) as total'))
      .where(filter)
      .first()

    data.total = total
  }

  if (fields.records) {
    const query = getSql(info.schema, server, fields.records, 'playerReportComments')
      .where(filter)

    if (order) {
      query.orderByRaw(order.replace('_', ' '))
    }

    let calculateAcl = false

    if (fields.records.fieldsByTypeName.PlayerReportComment.acl) {
      calculateAcl = true
      query.select(['actor_id'].map(f => `${tables.playerReportComments}.${f}`))
    }

    const results = await query.exec()

    data.records = results

    if (calculateAcl) {
      for (const result of results) {
        const acl = {
          delete: state.acl.hasServerPermission(serverId, 'player.reports', 'comment.delete.any') ||
            (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.delete.own') && state.acl.owns(result.actor_id))
        }

        result.acl = acl
      }
    }
  }

  return data
}
