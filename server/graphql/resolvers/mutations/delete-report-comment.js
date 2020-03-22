const ExposedError = require('../../../data/exposed-error')

module.exports = async function deleteReportComment (obj, { comment: id, serverId }, { state }) {
  const server = state.serversPool.get(serverId)
  const tables = server.config.tables
  const comment = await state.loaders.reportComment.serverDataId.load({ id, serverId })

  if (!comment) throw new ExposedError(`Comment ${id} does not exist`)
  if (!comment.acl.delete) throw new ExposedError('You do not have permission to perform this action')

  await state.dbPool.execute(`DELETE FROM ${tables.playerReportComments} WHERE id = ?`, [id])

  return comment
}
