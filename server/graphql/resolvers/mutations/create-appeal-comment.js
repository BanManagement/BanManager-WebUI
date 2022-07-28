const ExposedError = require('../../../data/exposed-error')
const appealComment = require('../queries/appeal-comment')
const { getAppealCommentType } = require('../../utils')
const { getNotificationType } = require('../../../data/notification')
const { subscribeAppeal, notifyAppeal } = require('../../../data/notification/appeal')

module.exports = async function createAppealComment (obj, { id: appealId, input }, { session, state }, info) {
  const [data] = await state.dbPool('bm_web_appeals')
    .where({ id: appealId })

  if (!data) throw new ExposedError(`Appeal ${appealId} does not exist`)

  const hasPermission = state.acl.hasServerPermission(data.server_id, 'player.appeals', 'comment.any') ||
    (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'comment.own') && state.acl.owns(data.actor_id)) ||
    (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'comment.assigned') && state.acl.owns(data.assignee_id))

  if (!hasPermission) throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')
  if (data.state_id > 2) throw new ExposedError('You cannot comment on a closed appeal')

  const [id] = await state.dbPool('bm_web_appeal_comments').insert({
    appeal_id: appealId,
    actor_id: session.playerId,
    content: input.content,
    type: getAppealCommentType('comment'),
    created: state.dbPool.raw('UNIX_TIMESTAMP()'),
    updated: state.dbPool.raw('UNIX_TIMESTAMP()')
  }, ['id'])

  await subscribeAppeal(state.dbPool, appealId, session.playerId)
  await notifyAppeal(state.dbPool, getNotificationType('appealComment'), appealId, data.server_id, id, session.playerId)

  return appealComment(obj, { id }, { state }, info)
}
