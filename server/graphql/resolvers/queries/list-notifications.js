const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const ExposedError = require('../../../data/exposed-error')
const { getNotificationType, getNotificationState } = require('../../../data/notification')

module.exports = async function listNotifications (obj, { limit, offset }, { session, state }, info) {
  if (limit > 50) throw new ExposedError('Limit too large')

  const data = {}
  const filter = state.dbPool('bm_web_notifications AS n1')
    .select(state.dbPool.raw('MIN(n1.id)'))
    .where('n1.server_id', '=', state.dbPool.raw('n.server_id'))
    .andWhere(builder => {
      builder
        .where('n1.report_id', '=', state.dbPool.raw('n.report_id'))
        .orWhereNull('n1.report_id')
    })
    .andWhere('n1.player_id', '=', state.dbPool.raw('n.player_id'))
    .andWhere(builder => {
      builder
        .where('n1.appeal_id', '=', state.dbPool.raw('n.appeal_id'))
        .orWhereNull('n1.appeal_id')
    })
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)

  if (fields.total) {
    const { total } = await state.dbPool('bm_web_notifications AS n')
      .select(state.dbPool.raw('COUNT(*) as total'))
      .where('n.id', '=', filter)
      .andWhere({
        player_id: session.playerId
      })
      .first()

    data.total = total
  }

  const reportCommentIds = [...state.serversPool.keys()].reduce((acc, serverId) => {
    acc[serverId] = []

    return acc
  }, {})

  if (fields.records) {
    const results = await state.dbPool('bm_web_notifications AS n')
      .select('n.*', 'bm_web_appeal_comments.id AS appeal_comment_id', 'bm_web_appeal_comments.content AS comment_content')
      .leftJoin('bm_web_appeal_comments', 'bm_web_appeal_comments.id', 'n.comment_id')
      .where('n.id', '=', filter)
      .andWhere({
        player_id: session.playerId
      })
      .orderBy('n.updated', 'DESC')
      .limit(limit)
      .offset(offset)

    data.records = results.map(result => {
      if (fields.records.fieldsByTypeName.Notification.actor && result.actor_id) {
        result.actor = state.loaders.player.load({ id: result.actor_id, fields: ['name'] })
      }

      result.type = getNotificationType(result.type)
      result.state = getNotificationState(result.state_id)

      if (fields.records.fieldsByTypeName.Notification.comment && result.appeal_comment_id) {
        result.comment = { id: result.appeal_comment_id, content: result.comment_content }
      } else if (fields.records.fieldsByTypeName.Notification.comment && result.report_id && result.comment_id) {
        reportCommentIds[result.server_id].push([result.comment_id, result.report_id])
      }

      return result
    })

    if (fields.records.fieldsByTypeName.Notification.comment) {
      for (const [serverId, ids] of Object.entries(reportCommentIds)) {
        const server = state.serversPool.get(serverId)
        const comments = await server.pool(server.config.tables.playerReportComments)
          .select('id', 'comment AS content')
          .whereIn(['id', 'report_id'], ids)

        for (const comment of comments) {
          const record = data.records.find(record => record.comment_id === comment.id)

          if (record) record.comment = comment
        }
      }
    }
  }

  return data
}
