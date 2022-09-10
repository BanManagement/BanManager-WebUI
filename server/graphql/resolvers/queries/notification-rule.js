const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')

module.exports = async function notificationRule (obj, { id }, { state }, info) {
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)
  const [data] = await state.dbPool('bm_web_notification_rules').where('id', id)

  if (!data || !data.id) return data

  if (fields.server && data.server_id) {
    const server = state.serversPool.get(data.server_id)

    data.server = server.config
  }

  if (fields.roles) {
    data.roles = await state.dbPool('bm_web_notification_rule_roles')
      .select('r.role_id AS id', 'r.name')
      .leftJoin('bm_web_roles AS r', 'r.role_id', 'bm_web_notification_rule_roles.role_id')
      .where({ notification_rule_id: id })
  }

  return data
}
