const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const ExposedError = require('../../../data/exposed-error')
const viewPerms = [
  ['view.own', 'actor_id'],
  ['view.assigned', 'assignee_id']
]

module.exports = async function listPlayerAppealComments (obj, { id, actor, limit, offset, order }, { session, state }, info) {
  if (limit > 50) throw new ExposedError('Limit too large')

  const appeal = await state.dbPool('bm_web_appeals')
    .where({ id })
    .first()

  if (!appeal) throw new ExposedError(`Appeal ${id} does not exist`)

  if (!state.acl.hasServerPermission(appeal.server_id, 'player.appeals', 'view.any')) {
    if (!session || !session.playerId) return { total: 0, records: [] }

    const deny = viewPerms.every(([perm]) => state.acl.hasServerPermission(appeal.server_id, 'player.appeals', perm) === false)

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
      .where(filter)
      .limit(limit)
      .offset(offset)

    if (order) {
      query.orderByRaw(order.replace('_', ' '))
    }

    const results = await query

    data.records = results.map(result => {
      return {
        ...result,
        actor: state.loaders.player.load({ id: result.actor_id, fields: ['name'] })
      }
    })

    if (fields.records.fieldsByTypeName.PlayerAppealComment.acl) {
      for (const result of results) {
        const acl = {
          delete: state.acl.hasServerPermission(appeal.server_id, 'player.appeals', 'comment.delete.any') ||
            (state.acl.hasServerPermission(appeal.server_id, 'player.appeals', 'comment.delete.own') && state.acl.owns(data.actor_id))
        }

        result.acl = acl
      }
    }
  }

  return data
}
