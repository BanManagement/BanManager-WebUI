const { nanoid } = require('nanoid/async')

const types = ['reportComment', 'reportAssigned', 'reportState', 'appealComment', 'appealAssigned', 'appealState', 'appealEditPunishment', 'appealDeletePunishment', 'appealCreated']
const states = ['unread', 'read']

const getUnreadNotificationsCount = async (dbPool, playerId) => {
  const filter = dbPool('bm_web_notifications AS n1')
    .select(dbPool.raw('MIN(n1.id)'))
    .where('n1.server_id', '=', dbPool.raw('n.server_id'))
    .andWhere(builder => {
      builder
        .where('n1.report_id', '=', dbPool.raw('n.report_id'))
        .orWhereNull('n1.report_id')
    })
    .andWhere('n1.player_id', '=', dbPool.raw('n.player_id'))
    .andWhere(builder => {
      builder
        .where('n1.appeal_id', '=', dbPool.raw('n.appeal_id'))
        .orWhereNull('n1.appeal_id')
    })

  const { total } = await dbPool('bm_web_notifications AS n')
    .select(dbPool.raw('COUNT(*) as total'))
    .where('n.id', '=', filter)
    .andWhere({
      player_id: playerId,
      state_id: getNotificationState('unread')
    })
    .first()

  return total || 0
}

const getNotificationType = (type) => {
  if (typeof type === 'string') return types.findIndex(t => t === type)

  return types[type]
}

const getNotificationState = (type) => {
  if (typeof type === 'string') return states.findIndex(t => t === type)

  return states[type]
}

const generateNotificationId = async () => nanoid()

module.exports = {
  generateNotificationId,
  getNotificationType,
  getNotificationState,
  getUnreadNotificationsCount
}
