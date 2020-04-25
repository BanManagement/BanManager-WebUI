const { find } = require('lodash')
const ExposedError = require('../../../data/exposed-error')
const role = require('../queries/role')

module.exports = async function createRole (obj, { input: { name, parent, resources } }, { state }, info) {
  if (parent < 1 || parent > 3) throw new ExposedError('Invalid parent')

  let id

  await state.dbPool.transaction(async trx => {
    const [insertId] = await trx('bm_web_roles').insert({ name, parent_role_id: parent }, ['id'])
    const allResources = await trx('bm_web_resources').select('resource_id AS id')

    for (const allResource of allResources) {
      // eslint-disable-next-line eqeqeq
      const resource = find(resources, (r) => r.id == allResource.id)

      if (!resource) {
        await trx('bm_web_role_resources').insert({ value: 0, role_id: insertId, resource_id: allResource.id })
        continue
      }

      const ids = resource.permissions // @TODO reduce and Promise.all
        .filter(perm => perm.allowed)
        .map(perm => perm.id)

      if (!ids.length) {
        await trx('bm_web_role_resources').insert({ value: 0, role_id: insertId, resource_id: allResource.id })
        continue
      }

      await trx.raw(`INSERT INTO bm_web_role_resources
        (role_id, resource_id, value)
        VALUES (?, ?, (
          SELECT
            SUM(value)
          FROM
            bm_web_resource_permissions
          WHERE
            permission_id IN (?)
        ))
      `, [insertId, resource.id, ids])
    }

    id = insertId

    await trx.commit()
  })

  return role(obj, { id }, { state }, info)
}
