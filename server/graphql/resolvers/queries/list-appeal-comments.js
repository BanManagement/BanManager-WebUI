const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const ExposedError = require('../../../data/exposed-error')
const { getAppealCommentType } = require('../../utils')
const viewPerms = [
  ['view.own', 'actor_id'],
  ['view.assigned', 'assignee_id']
]

module.exports = async function listPlayerAppealComments (obj, { id, actor, order }, { session, state }, info) {
  const appeal = await state.dbPool('bm_web_appeals')
    .where({ id })
    .first()

  if (!appeal) throw new ExposedError(`Appeal ${id} does not exist`)

  if (!state.acl.hasServerPermission(appeal.server_id, 'player.appeals', 'view.any')) {
    if (!session || !session.playerId) return { total: 0, records: [] }

    const deny = viewPerms.every(([perm, field]) => state.acl.hasServerPermission(appeal.server_id, 'player.appeals', perm) === false || state.acl.owns(appeal[field]) === false)

    if (deny) return { total: 0, records: [] }
  }

  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)
  const data = {}
  const filter = { appeal_id: id }

  if (actor) filter.actor_id = actor

  if (fields.total) {
    const { total } = await state.dbPool('bm_web_appeal_comments')
      .select(state.dbPool.raw('COUNT(*) as total'))
      .where(filter)
      .first()

    data.total = total
  }

  if (fields.records) {
    const query = state.dbPool('bm_web_appeal_comments')
      .select([
        'bm_web_appeal_comments.*',
        'states.name AS name'
      ])
      .leftJoin('bm_web_appeal_states AS states', 'states.id', 'bm_web_appeal_comments.state_id')
      .where(filter)

    if (order) {
      query.orderByRaw(order.replace('_', ' '))
    }

    const results = await query

    data.records = results.map(result => {
      const record = {
        ...result,
        type: getAppealCommentType(result.type),
        actor: state.loaders.player.load({ id: result.actor_id, fields: ['name'] }),
        oldReason: result.old_reason,
        newReason: result.new_reason,
        oldExpires: result.old_expires,
        newExpires: result.new_expires,
        oldPoints: result.old_points,
        newPoints: result.new_points,
        oldSoft: result.old_soft,
        newSoft: result.new_soft
      }

      if (fields.records.fieldsByTypeName.PlayerAppealComment.state && result.state_id) {
        record.state = {
          id: result.state_id,
          name: result.name
        }
      }

      if (fields.records.fieldsByTypeName.PlayerAppealComment.assignee && result.assignee_id) {
        record.assignee = state.loaders.player.load({ id: result.assignee_id, fields: ['name'] })
      }

      if (fields.records.fieldsByTypeName.PlayerAppealComment.acl) {
        record.acl = {
          delete: state.acl.hasServerPermission(appeal.server_id, 'player.appeals', 'comment.delete.any') ||
            (state.acl.hasServerPermission(appeal.server_id, 'player.appeals', 'comment.delete.own') && state.acl.owns(result.actor_id))
        }
      }

      return record
    })
  }

  return data
}
