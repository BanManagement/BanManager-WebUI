const udify = require('../../../data/udify')

module.exports = async function updateRole (obj
  , { id, input: { name, parent, resources } }
  , { state: { dbPool, loaders } }) {
  if (id < 4 && parent) throw new Error('Default roles can not have a parent')

  await udify.update(dbPool, 'bm_web_roles', { name, parent_role_id: parent || null }, { role_id: id })

  // Do not allow users to change admin role resources in case they lock themselves out
  if (id === 3 || id === '3') return loaders.role.ids.load(id)

  for (const resource of resources) {
    const ids = resource.permissions // @TODO reduce and Promise.all
      .filter(perm => perm.allowed)
      .map(perm => perm.id)

    if (!ids.length) {
      await dbPool.query(`UPDATE bm_web_role_resources
        SET
          value = 0
        WHERE
          role_id = ? AND resource_id = ?
      `, [id, resource.id])
    } else {
      await dbPool.query(`UPDATE bm_web_role_resources
        SET
          value = (SELECT
              SUM(value)
            FROM
              bm_web_resource_permissions
            WHERE
              permission_id IN (?))
        WHERE
          role_id = ? AND resource_id = ?
      `, [ids, id, resource.id])
    }
  }

  return loaders.role.ids.load(id)
}
