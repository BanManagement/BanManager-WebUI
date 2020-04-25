const ExposedError = require('../../../data/exposed-error')
const reportComment = require('../queries/report-comment')

module.exports = async function deleteReportComment (obj, { id, serverId }, { state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server not found')

  const server = state.serversPool.get(serverId)
  const comment = await reportComment(obj, { id, serverId }, { state }, info)

  if (!comment.acl || !comment.acl.delete) throw new ExposedError('You do not have permission to perform this action')

  await server.pool(server.config.tables.playerReportComments)
    .where({ id })
    .del()

  return comment
}
