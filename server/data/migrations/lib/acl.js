module.exports = (db) => {
  async function getResourceId (resourceName) {
    const [results] = await db.runSql('SELECT resource_id FROM bm_web_resources WHERE name = ?', [resourceName])

    return results.resource_id
  }

  return {
    async addPermission (resourceName, ...permissionNames) {
      const resourceId = await getResourceId(resourceName)
      const [result] = await db.runSql('SELECT COUNT(resource_id) AS i FROM bm_web_resource_permissions WHERE resource_id = ?', [resourceId])
      let i = result.i

      for (const name of permissionNames) {
        // Check if permission already exists
        const existing = await db.runSql(
          'SELECT 1 FROM bm_web_resource_permissions WHERE resource_id = ? AND name = ?',
          [resourceId, name]
        )
        if (existing && existing.length > 0) continue

        const value = Math.pow(2, i++)

        await db.insert('bm_web_resource_permissions', ['resource_id', 'name', 'value'], [resourceId, name, value])
      }
    },
    async attachPermission (resourceName, roleId, ...permissionNames) {
      const resourceId = await getResourceId(resourceName)

      // Build placeholders for IN clause - one ? for each permission name
      const placeholders = permissionNames.map(() => '?').join(', ')
      const permissions = await db.runSql(
        `SELECT * FROM bm_web_resource_permissions WHERE resource_id = ? AND name IN(${placeholders})`,
        [resourceId, ...permissionNames]
      )

      // Use bitwise OR to avoid issues with duplicate additions
      return Promise.all(permissions.map((permission) => {
        return db.runSql(
          'UPDATE bm_web_role_resources SET value = value | ? WHERE role_id = ? AND resource_id = ?',
          [permission.value, roleId, resourceId]
        )
      }))
    },
    async addResource (name) {
      const { insertId: resourceId } = await db.insert('bm_web_resources', ['name'], [name])

      return db.runSql('INSERT INTO bm_web_role_resources (`role_id`, `resource_id`, `value`) SELECT `role_id`, ?, 0 FROM bm_web_roles', [resourceId])
    },
    async removeResource (name) {
      return db.runSql('DELETE FROM bm_web_resources WHERE name = ?', [name])
    }
  }
}
