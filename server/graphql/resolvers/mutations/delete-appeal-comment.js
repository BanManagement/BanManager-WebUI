const ExposedError = require('../../../data/exposed-error')
const { getNotificationType } = require('../../../data/notification')
const appealComment = require('../queries/appeal-comment')

module.exports = async function deleteAppealComment (obj, { id }, { state }, info) {
  const comment = await appealComment(obj, { id }, { state }, info)

  if (!comment.acl || !comment.acl.delete || !comment.content) throw new ExposedError('You do not have permission to perform this action')

  await state.dbPool.transaction(async trx => {
    await trx('bm_web_appeal_comments')
      .where({ id })
      .del()

    await trx('bm_web_notifications')
      .where({ comment_id: id, type: getNotificationType('appealComment') })
  })

  return comment
}
