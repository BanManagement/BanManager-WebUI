const ExposedError = require('../../../data/exposed-error')
const notificationRule = require('../queries/notification-rule')

module.exports = async function updateNotificationRule (obj, { id, input: { type, roles, serverId } }, { state }, info) {
  const data = await notificationRule(obj, { id }, { state }, info)

  if (!data) throw new ExposedError(`Notification rule ${id} does not exist`)

  if (serverId) {
    const server = state.serversPool.get(serverId)

    if (!server) throw new ExposedError(`Server ${serverId} does not exist`)
  }

  const roleIds = roles.map(role => role.id)
  const results = await state.dbPool('bm_web_roles').select('role_id').whereIn('role_id', roleIds)

  if (results.length !== roleIds.length) {
    throw new ExposedError('Invalid role')
  }

  await state.dbPool.transaction(async trx => {
    await trx('bm_web_notification_rules')
      .update({
        type,
        server_id: serverId,
        updated: trx.raw('UNIX_TIMESTAMP()')
      })
      .where({ id })

    await trx('bm_web_notification_rule_roles')
      .where({ notification_rule_id: id })
      .del()

    await Promise.all(roles.map(role => {
      return trx('bm_web_notification_rule_roles').insert({ notification_rule_id: id, role_id: role.id })
    }))
  })

  return notificationRule(obj, { id }, { state }, info)
}
