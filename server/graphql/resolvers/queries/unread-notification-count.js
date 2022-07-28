const { getUnreadNotificationsCount } = require('../../../data/notification')

module.exports = async function unreadNotificationCount (obj, args, { session, state }, info) {
  return getUnreadNotificationsCount(state.dbPool, session.playerId)
}
