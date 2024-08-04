const { nanoid } = require('nanoid/async')
const webPush = require('web-push')

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

const getPushNotificationSubscriptions = async (dbPool, playerIds = []) => {
  const data = await dbPool('bm_web_notification_subscriptions')
    .select('player_id', 'endpoint', 'auth', 'p256dh')
    .whereIn('player_id', playerIds)

  // eslint-disable-next-line camelcase
  return data.reduce((acc, { player_id, endpoint, auth, p256dh }) => {
    if (!acc[player_id]) {
      acc[player_id] = []
    }

    acc[player_id].push({
      endpoint,
      keys: {
        auth,
        p256dh
      }
    })

    return acc
  }, {})
}

const sendPushNotification = async (dbPool, subscription, payload) => {
  try {
    await webPush.sendNotification(subscription, payload, {
      vapidDetails: {
        subject: `mailto:${process.env.CONTACT_EMAIL}`,
        publicKey: process.env.NOTIFICATION_VAPID_PUBLIC_KEY,
        privateKey: process.env.NOTIFICATION_VAPID_PRIVATE_KEY
      }
    })
  } catch (err) {
    if (err.statusCode === 410) {
      await dbPool('bm_web_notification_subscriptions')
        .where('endpoint', subscription.endpoint)
        .del()
    }
  }
}

const sendPushNotifications = async (dbPool, subscriptions, payload) => {
  return Promise.all(subscriptions.map(subscription => sendPushNotification(dbPool, subscription, payload)))
}

const generateNotificationId = async () => nanoid()

module.exports = {
  generateNotificationId,
  getNotificationType,
  getNotificationState,
  getUnreadNotificationsCount,
  getPushNotificationSubscriptions,
  sendPushNotification,
  sendPushNotifications
}
