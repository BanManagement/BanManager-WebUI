module.exports = async function resources (obj, info, { state: { dbPool } }) {
  const resources = await dbPool('bm_web_resources').select('resource_id AS id', 'name')
  const permissions = await dbPool('bm_web_resource_permissions').select('permission_id', 'resource_id', 'name')

  resources.forEach(resource => {
    const perms = permissions.filter(perm => perm.resource_id === resource.id)

    if (!perms) resource.permissions = []

    resource.permissions = perms.map(perm => (
      {
        id: perm.permission_id,
        name: perm.name,
        allowed: false,
        serversAllowed: []
      }
    ))
  })

  return resources
}
