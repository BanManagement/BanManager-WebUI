const { recordToTable, recordToResource } = require('../../../data/tables')

module.exports = async function deletePunishmentRecord (obj, { id, serverId, type }, { state: { acl, serversPool } }) {
  const server = serversPool.get(serverId)
  const table = server.config.tables[recordToTable(type)]
  const resource = recordToResource(type)

  const [results] = await server.query('SELECT actor_id FROM ?? WHERE id = ?', [table, id])

  if (!results.length) throw new Error('Record does not exist')

  const { actor_id: actorId } = results[0]
  const canDelete = acl.hasServerPermission(serverId, resource, 'delete.any') ||
    (acl.hasServerPermission(serverId, resource, 'delete.own') && acl.owns(actorId)) ||
    (acl.hasServerPermission(serverId, resource, 'delete.any')) ||
    (acl.hasServerPermission(serverId, resource, 'delete.own') && acl.owns(actorId))

  if (!canDelete) {
    throw new Error('You do not have permission to perform this action, please contact your server administrator')
  }

  await server.query('DELETE FROM ?? WHERE id = ?', [table, id])

  return id
}
