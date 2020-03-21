const { name } = require('faker')
const { parse } = require('uuid-parse')
const udify = require('../../data/udify')

module.exports = async (dbPool, player, resourceName, ...permissionNames) => {
  const conn = await dbPool.getConnection()
  const roleName = name.firstName()
  const playerId = Buffer.isBuffer(player.id) ? player.id : parse(player.id, Buffer.alloc(16))
  let roleId

  try {
    const [{ insertId }] = await udify.insert(conn, 'bm_web_roles', { name: roleName, parent_role_id: 1 })
    const [[resource]] = await conn.execute('SELECT resource_id AS id FROM bm_web_resources WHERE name = ?', [resourceName])
    const [permissions] = await conn.execute('SELECT permission_id, name, value FROM bm_web_resource_permissions WHERE resource_id = ?', [resource.id])
    let value = 0

    for (const permission of permissions) {
      if (permissionNames.includes(permission.name)) value += permission.value
    }

    await udify.insert(conn, 'bm_web_role_resources', { value, role_id: insertId, resource_id: resource.id })
    await udify.insert(conn, 'bm_web_player_roles', { player_id: playerId, role_id: insertId })

    await conn.commit()

    roleId = insertId
  } catch (e) {
    console.error(e)

    if (!conn.connection._fatalError) {
      await conn.rollback()
    }
  } finally {
    await conn.release()
  }

  if (!roleId) throw new Error('Failed to create role')

  return {
    async reset () {
      await udify.delete(dbPool, 'bm_web_role_resources', { role_id: roleId })
      await udify.delete(dbPool, 'bm_web_player_roles', { player_id: playerId, role_id: roleId })
      await udify.delete(dbPool, 'bm_web_roles', { role_id: roleId })
    }
  }
}
