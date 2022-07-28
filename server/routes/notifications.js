const { getNotificationState, getNotificationType } = require('../data/notification')

module.exports = async function (ctx) {
  const { request: { params }, session, state, throw: throwError } = ctx

  if (typeof params.id !== 'string' || params.id.length > 22) {
    return throwError(400, 'Invalid notification ID')
  }

  if (!session || !session.playerId) return throwError(400, 'You are not logged in')

  const notification = await state.dbPool('bm_web_notifications')
    .select('type', 'server_id', 'report_id', 'comment_id', 'appeal_id', 'state_id')
    .where({ id: params.id, player_id: session.playerId })
    .first()

  if (!notification) {
    ctx.status = 404
    return
  }

  switch (notification.type) {
    case getNotificationType('reportComment'):
      ctx.redirect(`/reports/${notification.server_id}/${notification.report_id}#comment-${notification.comment_id}`)
      break

    case getNotificationType('reportState'):
    case getNotificationType('reportAssigned'):
      ctx.redirect(`/reports/${notification.server_id}/${notification.report_id}`)
      break

    case getNotificationType('appealComment'):
      ctx.redirect(`/appeals/${notification.appeal_id}#comment-${notification.comment_id}`)
      break

    case getNotificationType('appealState'):
    case getNotificationType('appealAssigned'):
    case getNotificationType('appealEditPunishment'):
    case getNotificationType('appealDeletePunishment'):
      ctx.redirect(`/appeals/${notification.appeal_id}`)
      break

    default:
      throw new Error(`Unknown notification type ${notification.type} for ${notification.id}`)
  }

  if (notification.state_id === getNotificationState('unread')) {
    if (notification.report_id) {
      // Mark all notifications for this report as read
      await state.dbPool('bm_web_notifications')
        .where({ report_id: notification.report_id, server_id: notification.server_id, player_id: session.playerId })
        .update({ state_id: getNotificationState('read') })
    } else if (notification.appeal_id) {
      await state.dbPool('bm_web_notifications')
        .where({ appeal_id: notification.appeal_id, server_id: notification.server_id, player_id: session.playerId })
        .update({ state_id: getNotificationState('read') })
    } else {
      await state.dbPool('bm_web_notifications')
        .where({ id: params.id, player_id: session.playerId })
        .update({ state_id: getNotificationState('read') })
    }
  }
}
