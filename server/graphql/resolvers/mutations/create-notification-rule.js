const ExposedError = require('../../../data/exposed-error')
const notificationRule = require('../queries/notification-rule')

module.exports = async function createNotificationRule (obj, { input: { type, roles, serverId } }, { state }, info) {
  if (serverId) {
    const server = state.serversPool.get(serverId)

    if (!server) throw new ExposedError(`Server ${serverId} does not exist`)
  }

  const roleIds = roles.map(role => role.id)
  const data = await state.dbPool('bm_web_roles').select('role_id').whereIn('role_id', roleIds)

  if (data.length !== roleIds.length) {
    throw new ExposedError('Invalid role')
  }

  let id

  await state.dbPool.transaction(async trx => {
    const [insertId] = await trx('bm_web_notification_rules').insert({
      type,
      server_id: serverId,
      created: trx.raw('UNIX_TIMESTAMP()'),
      updated: trx.raw('UNIX_TIMESTAMP()')
    }, ['id'])

    await Promise.all(roles.map(role => {
      return trx('bm_web_notification_rule_roles').insert({ notification_rule_id: insertId, role_id: role.id })
    }))

    id = insertId
  })

  return notificationRule(obj, { id }, { state }, info)
}
