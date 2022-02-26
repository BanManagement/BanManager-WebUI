const ExposedError = require('../../../data/exposed-error')
const appealComment = require('../queries/appeal-comment')

module.exports = async function deleteAppealComment (obj, { id }, { state }, info) {
  const comment = await appealComment(obj, { id }, { state }, info)

  if (!comment.acl || !comment.acl.delete || !comment.content) throw new ExposedError('You do not have permission to perform this action')

  await state.dbPool('bm_web_appeal_comments')
    .where({ id })
    .del()

  return comment
}
