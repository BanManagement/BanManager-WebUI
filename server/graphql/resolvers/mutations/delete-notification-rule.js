const ExposedError = require('../../../data/exposed-error')
const notificationRule = require('../queries/notification-rule')

module.exports = async function deleteNotificationRule (obj, { id }, { state }, info) {
  const data = await notificationRule(obj, { id }, { state }, info)

  if (!data) throw new ExposedError(`Notification rule ${id} does not exist`)

  await state.dbPool('bm_web_notification_rules').where('id', id).del()

  return data
}
