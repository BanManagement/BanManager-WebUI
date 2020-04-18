const { find } = require('lodash')
const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')

module.exports = async function createRole (obj, { input: { name, parent, resources } }, { log, state: { dbPool, loaders } }, info) {
  let id

  try {
    await dbPool.transaction(async trx => {
      const [insertId] = await trx('bm_web_roles').insert({ name, parent_role_id: parent }, ['id'])
      const allResources = await trx('bm_web_resources').select('resource_id AS id')

      for (const allResource of allResources) {
        const resource = find(resources, { id: allResource.id })

        if (!resource) {
          await trx('bm_web_role_resources').insert({ value: 0, role_id: id, resource_id: allResource.id })
          continue
        }

        const ids = resource.permissions // @TODO reduce and Promise.all
          .filter(perm => perm.allowed)
          .map(perm => perm.id)

        if (!ids.length) {
          await trx('bm_web_role_resources').insert({ value: 0, role_id: id, resource_id: allResource.id })
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

        id = insertId
      }

      await trx.commit()
    })
  } catch (e) {
    log.error(e)
  }

  if (!id) throw new Error('An error occurred')

  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, {
    pool: dbPool,
    config: {
      tables: {
        roles: 'bm_web_roles'
      }
    }
  }, fields, 'roles').where('role_id', id)
  const [data] = await query.exec()

  return data
}
