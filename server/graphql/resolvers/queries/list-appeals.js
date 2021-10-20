const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function listPlayerAppeals (obj, { serverId, actor, assigned, state: stateId, limit, offset, order }, { state }, info) {
  if (serverId && !state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')
  if (limit > 50) throw new ExposedError('Limit too large')
  if (!state.acl.hasServerPermission(serverId, 'player.appeals', 'view.any')) {
    throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')
  }

  const data = {}
  const server = state.serversPool.get(serverId)
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)
  const filter = {}

  if (actor) filter.actor_id = actor
  if (assigned) filter.assignee_id = assigned
  if (stateId) filter.state_id = stateId

  if (fields.total) {
    const { total } = await state.dbPool('bm_web_appeals')
      .select(server.pool.raw('COUNT(*) as total'))
      .where(filter)
      .first()

    data.total = total
  }

  if (fields.records) {
    const query = await state.dbPool('bm_web_appeals')
      .select([
        'bm_web_appeals.*',
        'states.name AS name'
      ])
      .leftJoin('bm_web_appeal_states AS states', 'states.id', 'bm_web_appeals.state_id')
      .where(filter)
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
