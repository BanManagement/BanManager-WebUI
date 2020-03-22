const DataLoader = require('dataloader')

module.exports = ({ state }) => {
  const ids = new DataLoader(async roleIds => {
    return Promise.all(roleIds.map(async id => {
      const [[role]] = await state.dbPool.execute('SELECT role_id AS id, name, parent_role_id AS parent FROM bm_web_roles WHERE role_id = ?', [id])

      if (!role) return null

      const [resources] = await state.dbPool.execute('SELECT resource_id AS id, name FROM bm_web_resources')
      const [permissions] = await state.dbPool.execute(`
        SELECT
          rp.permission_id,
          rp.resource_id,
          rp.name,
          if(rp.value & wrr.value = 0, false, true) AS allowed
        FROM
          bm_web_resource_permissions rp
            LEFT JOIN
          bm_web_role_resources wrr ON wrr.resource_id = rp.resource_id
        WHERE
          wrr.role_id = ?
      `, [id])

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

      role.resources = resources

      return role
    }))
  })

  return {
    ids
  }
}
