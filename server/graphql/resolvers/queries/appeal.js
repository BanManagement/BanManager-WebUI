const { parseResolveInfo } = require('graphql-parse-resolve-info')
const ExposedError = require('../../../data/exposed-error')

// eslint-disable-next-line complexity
module.exports = async function appeal (obj, { id }, { state }, info) {
  const table = 'bm_web_appeals'
  const data = await state.dbPool(table)
    .select([
      `${table}.*`,
      'states.name AS name'
    ])
    .where(`${table}.id`, id)
    .leftJoin('bm_web_appeal_states AS states', 'states.id', `${table}.state_id`)
    .first()

  if (!data) throw new ExposedError(`Appeal ${id} does not exist`)

  if (!state.acl.hasServerPermission(data.server_id, 'player.appeals', 'view.any')) {
    const canView = (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'view.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'view.assigned') && state.acl.owns(data.assignee_id))

    if (!canView) {
      throw new ExposedError(
        'You do not have permission to perform this action, please contact your server administrator')
    }
  }

  data.state = {
    id: data.state_id,
    name: data.name
  }

  const fields = parseResolveInfo(info)
  const server = state.serversPool.get(data.server_id)

  data.server = server.config

  if (fields.fieldsByTypeName.PlayerAppeal.actor) {
    data.actor = await state.loaders.player.load({ id: data.actor_id, fields: ['name'] })
  }

  if (fields.fieldsByTypeName.PlayerAppeal.assignee && data.assignee_id) {
    data.assignee = await state.loaders.player.load({ id: data.assignee_id, fields: ['name'] })
  }

  if (fields.fieldsByTypeName.PlayerAppeal.acl) {
    data.acl = {
      comment: state.acl.hasServerPermission(data.server_id, 'player.appeals', 'comment.any') ||
        (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'comment.own') && state.acl.owns(data.actor_id)) ||
        (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'comment.assigned') && state.acl.owns(data.assignee_id)),
      assign: state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.assign.any') ||
        (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.assign.own') && state.acl.owns(data.actor_id)) ||
        (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.assign.assigned') && state.acl.owns(data.assignee_id)),
      state: state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.state.any') ||
        (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.state.own') && state.acl.owns(data.actor_id)) ||
        (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.state.assigned') && state.acl.owns(data.assignee_id)),
      delete: state.acl.hasServerPermission(data.server_id, 'player.appeals', 'delete.any') ||
        (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'delete.assigned') && state.acl.owns(data.assignee_id))
    }
  }

  return data
}
