const DataLoader = require('dataloader')
const { unparse } = require('uuid-parse')

module.exports = ({ state }) => {
  const serverDataId = new DataLoader(async reportIds => {
    const { serversPool } = state

    return Promise.all(reportIds.map(async ({ serverId, id }) => {
      const server = serversPool.get(serverId)
      const tables = server.config.tables
      const query = `
        SELECT
          c.id, c.comment, c.actor_id, a.name, created, updated
        FROM
          ${tables.playerReportComments} c
            LEFT JOIN
          ${tables.players} a ON c.actor_id = a.id
        WHERE c.id = ?`
      const [[result]] = await server.execute(query, [id])

      if (!result) return null

      const data = {
        id: result.id,
        created: result.created,
        updated: result.updated,
        actor: {
          id: unparse(result.actor_id),
          name: result.name
        },
        message: result.comment,
        acl: {
          delete: state.acl.hasServerPermission(serverId, 'player.reports', 'comment.delete.any') ||
            (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.delete.own') && state.acl.owns(result.actor_id))
        }
      }

      return data
    }))
  })

  return {
    serverDataId
  }
}
