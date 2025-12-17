const ExposedError = require('../../../data/exposed-error')
const appealComment = require('../queries/appeal-comment')
const { getAppealCommentType } = require('../../utils')
const { getNotificationType } = require('../../../data/notification')
const { subscribeAppeal, notifyAppeal } = require('../../../data/notification/appeal')

module.exports = async function createAppealComment (obj, { id: appealId, input }, { session, state }, info) {
  const [appeal] = await state.dbPool('bm_web_appeals')
    .where({ id: appealId })

  if (!appeal) throw new ExposedError(`Appeal ${appealId} does not exist`)

  const hasPermission = state.acl.hasServerPermission(appeal.server_id, 'player.appeals', 'comment.any') ||
    (state.acl.hasServerPermission(appeal.server_id, 'player.appeals', 'comment.own') && state.acl.owns(appeal.actor_id)) ||
    (state.acl.hasServerPermission(appeal.server_id, 'player.appeals', 'comment.assigned') && state.acl.owns(appeal.assignee_id))

  if (!hasPermission) throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')
  if (appeal.state_id > 2) throw new ExposedError('You cannot comment on a closed appeal')

  const hasDocuments = input.documents && input.documents.length > 0

  if (hasDocuments) {
    const hasAttachPermission = state.acl.hasServerPermission(appeal.server_id, 'player.appeals', 'attachment.create')
    if (!hasAttachPermission) {
      throw new ExposedError('You do not have permission to attach files')
    }
  }

  const commentId = await state.dbPool.transaction(async (trx) => {
    const [id] = await trx('bm_web_appeal_comments').insert({
      appeal_id: appealId,
      actor_id: session.playerId,
      content: input.content,
      type: getAppealCommentType('comment'),
      created: trx.raw('UNIX_TIMESTAMP()'),
      updated: trx.raw('UNIX_TIMESTAMP()')
    }, ['id'])

    if (!hasDocuments) return id

    const validDocs = await trx('bm_web_documents')
      .whereIn('id', input.documents)
      .where('player_id', session.playerId)
      .select('id')

    if (validDocs.length === 0) return id

    const links = validDocs.map(doc => ({
      appeal_id: appealId,
      comment_id: id,
      document_id: doc.id
    }))

    await trx('bm_web_appeal_documents').insert(links)

    return id
  })

  await subscribeAppeal(state.dbPool, appealId, session.playerId)
  await notifyAppeal(state.dbPool, getNotificationType('appealComment'), appealId, appeal.server_id, commentId, session.playerId, state)

  return appealComment(obj, { id: commentId }, { state }, info)
}
