const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function listNotificationRules (obj, { limit, offset }, { session, state }, info) {
  if (limit > 50) throw new ExposedError('Limit too large')

  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)
  const data = {}

  if (fields.total) {
    const { total } = await state.dbPool('bm_web_notification_rules')
      .select(state.dbPool.raw('COUNT(*) as total'))
      .first()

    data.total = total
  }

  if (fields.records) {
    const results = await state.dbPool('bm_web_notification_rules')
      .orderBy('updated', 'DESC')
      .limit(limit)
      .offset(offset)

    const ruleIds = results.map(result => result.id)
    const roles = await state.dbPool('bm_web_notification_rule_roles')
      .select('notification_rule_id', 'r.role_id AS id', 'r.name')
      .leftJoin('bm_web_roles AS r', 'r.role_id', 'bm_web_notification_rule_roles.role_id')
      .whereIn('notification_rule_id', ruleIds)

    data.records = results.map(result => {
      result.roles = roles.filter(role => role.notification_rule_id === result.id)
      result.server = state.serversPool.get(result.server_id)?.config

      return result
    })
  }

  return data
}
