const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const ExposedError = require('../../../data/exposed-error')
const viewPerms = [
  ['view.own', 'actor_id'],
  ['view.assigned', 'assignee_id']
]

module.exports = async function listPlayerAppeals (obj, { serverId, actor, assigned, state: stateId, limit, offset, order }, { session, state }, info) {
  if (serverId && !state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')
  if (limit > 50) throw new ExposedError('Limit too large')

  const data = {}
  const aclFilter = []

  if (!state.acl.hasServerPermission(serverId, 'player.appeals', 'view.any')) {
    if (!session || !session.playerId) return { ...data, total: 0, records: [] }

    const deny = viewPerms.every(([perm]) => state.acl.hasServerPermission(serverId, 'player.appeals', perm) === false)

    if (deny) return { ...data, total: 0, records: [] }

    viewPerms.forEach(([perm, field]) => {
      const allowed = state.acl.hasServerPermission(serverId, 'player.appeals', perm)

      if (allowed) aclFilter.push([field, session.playerId])
    })
  }

  const handleAclFilter = query => {
    for (const [field, value] of aclFilter) {
      query.orWhere(field, value)
    }
  }

  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)
  const filter = {}

  if (actor) filter.actor_id = actor
  if (assigned) filter.assignee_id = assigned
  if (stateId) filter.state_id = stateId
  if (serverId) filter.server_id = serverId

  if (fields.total) {
    const { total } = await state.dbPool('bm_web_appeals')
      .select(state.dbPool.raw('COUNT(*) as total'))
      .where(filter)
      .where(handleAclFilter)
      .first()

    data.total = total
  }

  if (fields.records) {
    const query = state.dbPool('bm_web_appeals')
      .select([
        'bm_web_appeals.*',
        'states.name AS name'
      ])
      .leftJoin('bm_web_appeal_states AS states', 'states.id', 'bm_web_appeals.state_id')
      .where(filter)
      .where(handleAclFilter)
      .limit(limit)
      .offset(offset)

    if (order) {
      query.orderByRaw(order.replace('_', ' '))
    }

    const results = await query

    data.records = results.map(result => {
      if (fields.records.fieldsByTypeName.PlayerAppeal.actor) {
        result.actor = state.loaders.player.load({ id: result.actor_id, fields: ['name'] })
      }

      if (fields.records.fieldsByTypeName.PlayerAppeal.punishmentActor) {
        result.punishmentActor = state.loaders.player.load({ id: result.punishment_actor_id, fields: ['name'] })
      }

      if (fields.records.fieldsByTypeName.PlayerAppeal.assignee && result.assignee_id) {
        result.assignee = state.loaders.player.load({ id: result.assignee_id, fields: ['name'] })
      }

      if (fields.records.fieldsByTypeName.PlayerAppeal.server) {
        result.server = state.serversPool.get(result.server_id)?.config
      }

      if (fields.records.fieldsByTypeName.PlayerAppeal.state) {
        result.state = {
          id: result.state_id,
          name: result.name
        }
      }

      if (fields.records.fieldsByTypeName.PlayerAppeal.punishmentReason) result.punishmentReason = result.punishment_reason
      if (fields.records.fieldsByTypeName.PlayerAppeal.punishmentCreated) result.punishmentCreated = result.punishment_created
      if (fields.records.fieldsByTypeName.PlayerAppeal.punishmentExpires) result.punishmentExpires = result.punishment_expires
      if (fields.records.fieldsByTypeName.PlayerAppeal.punishmentType) result.punishmentType = result.punishment_type
      if (fields.records.fieldsByTypeName.PlayerAppeal.punishmentSoft) result.punishmentSoft = result.punishment_soft
      if (fields.records.fieldsByTypeName.PlayerAppeal.punishmentPoints) result.punishmentPoints = result.punishment_points

      if (fields.records.fieldsByTypeName.PlayerAppeal.acl) {
        result.acl = {
          comment: state.acl.hasServerPermission(serverId, 'player.appeals', 'comment.any') ||
            (state.acl.hasServerPermission(serverId, 'player.appeals', 'comment.own') && state.acl.owns(result.actor_id)) ||
            (state.acl.hasServerPermission(serverId, 'player.appeals', 'comment.assigned') && state.acl.owns(result.assignee_id)),
          assign: state.acl.hasServerPermission(serverId, 'player.appeals', 'update.assign.any') ||
            (state.acl.hasServerPermission(serverId, 'player.appeals', 'update.assign.own') && state.acl.owns(result.actor_id)) ||
            (state.acl.hasServerPermission(serverId, 'player.appeals', 'update.assign.assigned') && state.acl.owns(result.assignee_id)),
          state: state.acl.hasServerPermission(serverId, 'player.appeals', 'update.state.any') ||
            (state.acl.hasServerPermission(serverId, 'player.appeals', 'update.state.own') && state.acl.owns(result.actor_id)) ||
            (state.acl.hasServerPermission(serverId, 'player.appeals', 'update.state.assigned') && state.acl.owns(result.assignee_id)),
          delete: state.acl.hasServerPermission(serverId, 'player.appeals', 'delete.any') ||
            (state.acl.hasServerPermission(serverId, 'player.appeals', 'delete.assigned') && state.acl.owns(result.assignee_id))
        }
      }

      return result
    })
  }

  return data
}
