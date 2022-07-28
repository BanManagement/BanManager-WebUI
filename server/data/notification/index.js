const { nanoid } = require('nanoid/async')

const types = ['reportComment', 'reportAssigned', 'reportState', 'appealComment', 'appealAssigned', 'appealState', 'appealEditPunishment', 'appealDeletePunishment']
const states = ['unread', 'read']

const getUnreadNotificationsCount = async (dbPool, playerId) => {
  const data = await dbPool('bm_web_notifications')
    .count({ count: '*' })
    .where({
      player_id: playerId,
      state_id: getNotificationState('unread')
    })
    .first()

  return data?.count || 0
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
