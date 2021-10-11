const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')
const getServer = require('./server')
const viewPerms = [
  ['view.own', 'actor_id'],
  ['view.assigned', 'assignee_id'],
  ['view.reported', 'player_id']
]

module.exports = async function listPlayerReports (obj, { serverId, actor, assigned, player, state: stateId, limit, offset, order }, { session, state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')
  if (limit > 50) throw new ExposedError('Limit too large')

  const data = { server: await getServer(obj, { id: serverId }, { state }, info) }
  const aclFilter = []

  if (!state.acl.hasServerPermission(serverId, 'player.reports', 'view.any')) {
    if (!session || !session.playerId) return { ...data, total: 0, records: [] }

    const deny = viewPerms.every(([perm]) => state.acl.hasServerPermission(serverId, 'player.reports', perm) === false)

    if (deny) return { ...data, total: 0, records: [] }

    viewPerms.forEach(([perm, field]) => {
      const allowed = state.acl.hasServerPermission(serverId, 'player.reports', perm)

      if (allowed) aclFilter.push([field, session.playerId])
    })
  }

  const handleAclFilter = query => {
    for (const [field, value] of aclFilter) {
      query.orWhere(field, value)
    }
  }
  const server = state.serversPool.get(serverId)
  const tables = server.config.tables
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)
  const filter = {}

  if (actor) filter.actor_id = actor
  if (assigned) filter.assignee_id = assigned
  if (player) filter.player_id = player
  if (stateId) filter.state_id = stateId

  if (fields.total) {
    const { total } = await server.pool(tables.playerReports)
      .select(server.pool.raw('COUNT(*) as total'))
      .where(filter)
      .where(handleAclFilter)
      .first()

    data.total = total
  }

  if (fields.records) {
    const query = getSql(info.schema, server, fields.records, 'playerReports')
      .where(filter)
      .where(handleAclFilter)
      .limit(limit)
      .offset(offset)

    if (order) {
      query.orderByRaw(order.replace('_', ' '))
    }

    let calculateAcl = false

    if (fields.records.fieldsByTypeName.PlayerReport.acl) {
      calculateAcl = true
      query.select(['actor_id', 'player_id', 'assignee_id'].map(f => `${tables.playerReports}.${f}`))
    }

    const results = await query.exec()

    data.records = results

    if (calculateAcl) {
      for (const result of results) {
        const acl = {
          comment: state.acl.hasServerPermission(serverId, 'player.reports', 'comment.any') ||
            (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.own') && state.acl.owns(result.actor_id)) ||
            (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.assigned') && state.acl.owns(result.assignee_id)) ||
            (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.reported') && state.acl.owns(result.player_id)),
          assign: state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.any') ||
            (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.own') && state.acl.owns(result.actor_id)) ||
            (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.assigned') && state.acl.owns(result.assignee_id)) ||
            (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.reported') && state.acl.owns(result.player_id)),
          state: state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.any') ||
            (state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.own') && state.acl.owns(result.actor_id)) ||
            (state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.assigned') && state.acl.owns(result.assignee_id)) ||
            (state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.reported') && state.acl.owns(result.player_id)),
          delete: state.acl.hasServerPermission(serverId, 'player.reports', 'delete.any') ||
            (state.acl.hasServerPermission(serverId, 'player.reports', 'delete.assigned') && state.acl.owns(result.assignee_id))
        }

        result.acl = acl
      }
    }
  }

  return data
}
