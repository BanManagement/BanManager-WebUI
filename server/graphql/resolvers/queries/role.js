const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')

module.exports = async function role (obj, { id }, { state }, info) {
  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, {
    pool: state.dbPool,
    config: {
      tables: {
        roles: 'bm_web_roles',
        resources: 'bm_web_resources'
      }
    }
  }, fields, 'roles').where('role_id', id)
  const [data] = await query.exec()

  if (!data || !data.id) return data

  const resources = await state.dbPool('bm_web_resources').select('resource_id AS id', 'name')
  const permissions = await state.dbPool('bm_web_resource_permissions')
    .select(
      'bm_web_resource_permissions.permission_id',
      'bm_web_resource_permissions.resource_id',
      'bm_web_resource_permissions.name',
      state.dbPool.raw('if(bm_web_resource_permissions.value & wrr.value = 0, false, true) AS allowed')
    )
    .leftJoin('bm_web_role_resources AS wrr', 'wrr.resource_id', 'bm_web_resource_permissions.resource_id')
    .where('wrr.role_id', id)

  resources.forEach(resource => {
    const perms = permissions.filter(perm => perm.resource_id === resource.id)

    if (!perms) resource.permissions = []

    resource.permissions = perms.map(perm => (
      {
        id: perm.permission_id,
        name: perm.name,
        allowed: perm.allowed
      }
    ))
  })

  data.resources = resources

  return data
}
