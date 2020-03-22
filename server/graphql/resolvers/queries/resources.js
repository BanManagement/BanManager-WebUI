module.exports = async function resources (obj, info, { state: { dbPool } }) {
  const [resources] = await dbPool.execute('SELECT resource_id AS id, name FROM bm_web_resources')
  const [permissions] = await dbPool.execute(
    'SELECT permission_id, resource_id, name FROM bm_web_resource_permissions')

  resources.forEach(resource => {
    const perms = permissions.filter(perm => perm.resource_id === resource.id)

    if (!perms) resource.permissions = []

    resource.permissions = perms.map(perm => (
      {
        id: perm.permission_id,
        name: perm.name,
        allowed: false
      }
    ))
  })

  return resources
}
