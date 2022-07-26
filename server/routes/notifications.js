const { getNotificationState, getNotificationType } = require('../data/notification')

module.exports = async function (ctx) {
  const { request: { params }, session, state, throw: throwError } = ctx

  if (typeof params.id !== 'string' || params.id.length < 22) {
    return throwError(400, 'Invalid notification ID')
  }

  if (!session || !session.playerId) return throwError(400, 'You are not logged in')

  const notification = await state.dbPool('bm_web_notifications')
    .select('type', 'server_id', 'report_id', 'appeal_id', 'state_id')
    .where('id', params.id)
    .andWhere('player_id', session.playerId)
    .first()

  if (!notification) {
    ctx.status = 404
    return
  }

  console.log(notification, ctx.status)

  switch (notification.type) {
    case getNotificationType('reportComment'):
      ctx.redirect(`/reports/${notification.server_id}/${notification.report_id}#comment-${notification.comment_id}`)
      break
  }

  // Check if type found and unread
  if (ctx.status === 302 && notification.state_id === getNotificationState('unread')) {
    await state.dbPool('bm_web_notifications')
      .where('id', params.id)
      .andWhere('player_id', session.playerId)
      .update({ state_id: getNotificationState('read') })
  }
}
