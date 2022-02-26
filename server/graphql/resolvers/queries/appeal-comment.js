const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const { getAppealCommentType } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function appealComment (obj, { id }, { state }, info) {
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)
  const table = 'bm_web_appeal_comments'
  const data = await state.dbPool(table)
    .select([
      `${table}.*`,
      'appeal.server_id AS server_id',
      'states.name AS name'
    ])
    .leftJoin('bm_web_appeals AS appeal', 'appeal.id', `${table}.appeal_id`)
    .leftJoin('bm_web_appeal_states AS states', 'states.id', 'bm_web_appeal_comments.state_id')
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

  if (fields.actor) {
    data.actor = await state.loaders.player.load({ id: data.actor_id, fields: ['name'] })
  }

  if (fields.assignee && data.assignee_id) {
    data.assignee = await state.loaders.player.load({ id: data.assignee_id, fields: ['name'] })
  }

  if (fields.state && data.state_id) {
    data.state = {
      id: data.state_id,
      name: data.name
    }
  }

  data.type = getAppealCommentType(data.type)

  data.oldReason = data.old_reason
  data.newReason = data.new_reason
  data.oldExpires = data.old_expires
  data.newExpires = data.new_expires
  data.oldPoints = data.old_points
  data.newPoints = data.new_points
  data.oldSoft = data.old_soft
  data.newSoft = data.new_soft

  if (data && fields.acl) {
    data.acl = {
      delete: state.acl.hasServerPermission(data.server_id, 'player.appeals', 'comment.delete.any') ||
        (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'comment.delete.own') && state.acl.owns(data.actor_id))
    }
  }

  return data
}
