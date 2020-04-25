const ExposedError = require('../../../data/exposed-error')
const role = require('../queries/role')

module.exports = async function updateRole (obj, { id, input: { name, parent, resources } }, { state }, info) {
  if (id < 4 && parent) throw new ExposedError('Default roles can not have a parent')

  await state.dbPool('bm_web_roles').update({ name, parent_role_id: parent || null }).where({ role_id: id })

  // Do not allow users to change admin role resources in case they lock themselves out
  if (id === 3 || id === '3') return role(obj, { id }, { state }, info)

  await state.dbPool.transaction(async trx => {
    for (const resource of resources) {
      const ids = resource.permissions // @TODO reduce and Promise.all
        .filter(perm => perm.allowed)
        .map(perm => perm.id)

      if (!ids.length) {
        await trx.raw(`UPDATE bm_web_role_resources
          SET
            value = 0
          WHERE
            role_id = ? AND resource_id = ?
        `, [id, resource.id])
      } else {
        await trx.raw(`UPDATE bm_web_role_resources
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
  })

  return role(obj, { id }, { state }, info)
}
