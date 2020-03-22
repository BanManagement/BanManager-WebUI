const { find } = require('lodash')
const udify = require('../../../data/udify')

module.exports = async function createRole (obj
  , { input: { name, parent, resources } }
  , { log, state: { dbPool, loaders } }) {
  const conn = await dbPool.getConnection()
  let id

  try {
    await conn.beginTransaction()
    const [{ insertId }] = await udify.insert(conn, 'bm_web_roles', { name, parent_role_id: parent })
    const [allResources] = await conn.execute('SELECT resource_id AS id FROM bm_web_resources')

    id = insertId

    for (const allResource of allResources) {
      const resource = find(resources, { id: allResource.id })

      if (!resource) {
        await udify.insert(conn, 'bm_web_role_resources', { value: 0, role_id: id, resource_id: allResource.id })
        continue
      }

      const ids = resource.permissions // @TODO reduce and Promise.all
        .filter(perm => perm.allowed)
        .map(perm => perm.id)

      if (!ids.length) {
        await udify.insert(conn, 'bm_web_role_resources', { value: 0, role_id: id, resource_id: allResource.id })
        continue
      }

      await conn.query(`INSERT INTO bm_web_role_resources
        (role_id, resource_id, value)
        VALUES (?, ?, (
          SELECT
            SUM(value)
          FROM
            bm_web_resource_permissions
          WHERE
            permission_id IN (?)
        ))
      `, [id, resource.id, ids])
    }

    await conn.commit()
  } catch (e) {
    log.error(e)

    if (!conn.connection._fatalError) {
      await conn.rollback()
    }
  } finally {
    conn.release()
  }

  if (!id) throw new Error('An error occurred')

  return loaders.role.ids.load(id)
}
