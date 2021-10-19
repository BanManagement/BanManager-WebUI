const { parseResolveInfo } = require('graphql-parse-resolve-info')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function appealComment (obj, { id }, { state }, info) {
  const fields = parseResolveInfo(info)
  const table = 'bm_web_appeal_comments'
  const data = await state.dbPool(table)
    .select([
      `${table}.*`,
      'appeal.server_id AS server_id'
    ])
    .leftJoin('bm_web_appeals AS appeal', 'appeal.id', `${table}.appeal_id`)
    .where(`${table}.id`, id)
    .first()

  if (!data) throw new ExposedError('Appeal comment not found')

  if (!state.acl.hasServerPermission(data.server_id, 'player.appeals', 'view.any')) {
    // We need to perform some permission checks
    const [aclCheck] = await state.dbPool('bm_web_appeals')
      .select('actor_id', 'assignee_id')
      .where({ id: data.appeal_id })

    if (!aclCheck) throw new ExposedError('Appeal not found')

    const canView = (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'view.own') && state.acl.owns(aclCheck.actor_id)) ||
      (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'view.assigned') && state.acl.owns(aclCheck.assignee_id))

    if (!canView) {
      throw new ExposedError(
        'You do not have permission to perform this action, please contact your server administrator')
    }
  }

  if (fields.fieldsByTypeName.PlayerAppealComment.actor) {
    data.actor = await state.loaders.player.load({ id: data.actor_id, fields: ['name'] })
  }

  if (data && fields.fieldsByTypeName.PlayerAppealComment.acl) {
    data.acl = {
      delete: state.acl.hasServerPermission(data.server_id, 'player.appeals', 'comment.delete.any') ||
        (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'comment.delete.own') && state.acl.owns(data.actor_id))
    }
  }

  return data
}
