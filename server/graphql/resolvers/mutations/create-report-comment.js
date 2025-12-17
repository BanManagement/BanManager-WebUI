const ExposedError = require('../../../data/exposed-error')
const { getNotificationType } = require('../../../data/notification')
const { subscribeReport, notifyReport } = require('../../../data/notification/report')
const reportComment = require('../queries/report-comment')

module.exports = async function createReportComment (obj, { report: reportId, serverId, input }, { session, state }, info) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError(`Server ${serverId} does not exist`)

  const [data] = await server.pool(server.config.tables.playerReports)
    .where({ id: reportId })

  if (!data) throw new ExposedError(`Report ${reportId} does not exist`)

  const hasPermission = state.acl.hasServerPermission(serverId, 'player.reports', 'comment.any') ||
    (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.own') && state.acl.owns(data.actor_id)) ||
    (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.assigned') && state.acl.owns(data.assignee_id)) ||
    (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.reported') && state.acl.owns(data.player_id))

  if (!hasPermission) throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')
  if (data.state_id > 2) throw new ExposedError('You cannot comment on a closed report')

  const hasDocuments = input.documents && input.documents.length > 0

  if (hasDocuments) {
    const hasAttachPermission = state.acl.hasServerPermission(serverId, 'player.reports', 'attachment.create')
    if (!hasAttachPermission) {
      throw new ExposedError('You do not have permission to attach files')
    }
  }

  const [id] = await server.pool(server.config.tables.playerReportComments).insert({
    report_id: reportId,
    actor_id: session.playerId,
    comment: input.comment,
    created: server.pool.raw('UNIX_TIMESTAMP()'),
    updated: server.pool.raw('UNIX_TIMESTAMP()')
  }, ['id'])

  if (hasDocuments) {
    const validDocs = await state.dbPool('bm_web_documents')
      .whereIn('id', input.documents)
      .where('player_id', session.playerId)
      .select('id')

    if (validDocs.length > 0) {
      const links = validDocs.map(doc => ({
        server_id: serverId,
        comment_id: id,
        document_id: doc.id
      }))

      await state.dbPool('bm_web_report_comment_documents').insert(links)
    }
  }

  await subscribeReport(state.dbPool, reportId, serverId, session.playerId)
  await notifyReport(state.dbPool, getNotificationType('reportComment'), reportId, server, id, session.playerId, state)

  return reportComment(obj, { id, serverId }, { state }, info)
}
