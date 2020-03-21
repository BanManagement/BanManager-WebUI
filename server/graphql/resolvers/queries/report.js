const { unparse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')

// eslint-disable-next-line complexity
module.exports = async function report (obj, { id, serverId }, { state }) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server not found')

  const server = state.serversPool.get(serverId)
  const tables = server.config.tables
  const query = `SELECT
    r.id,
    r.reason,
    p.id AS player_id,
    p.name AS player_name,
    actor_id,
    a.name AS actor_name,
    assignee_id,
    ap.name AS assignee_name,
    created,
    updated,
    state_id,
    rps.name AS state_name
  FROM
    ${tables.playerReports} r
      LEFT JOIN
    ${tables.playerReportStates} rps ON r.state_id = rps.id
      LEFT JOIN
    ${tables.players} a ON r.actor_id = a.id
      JOIN
    ${tables.players} p ON r.player_id = p.id
      LEFT JOIN
    ${tables.players} ap ON r.assignee_id = ap.id
  WHERE r.id = ?`

  const [[result]] = await server.execute(query, [id])

  if (!result) throw new ExposedError('Report not found')

  const data = {
    id: result.id,
    reason: result.reason,
    created: result.created,
    updated: result.updated,
    player: {
      id: unparse(result.player_id),
      name: result.player_name
    },
    actor: {
      id: unparse(result.actor_id),
      name: result.actor_name
    },
    state: {
      id: result.state_id,
      name: result.state_name
    },
    server: server.config,
    acl: {
      comment: state.acl.hasServerPermission(serverId, 'player.reports', 'comment.any') ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.own') && state.acl.owns(result.actor_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.assigned') && state.acl.owns(result.assignee_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'comment.reported') && state.acl.owns(result.player_id)),
      assign: state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.any') ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.own') && state.acl.owns(result.actor_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.assigned') && state.acl.owns(result.assignee_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.reported') && state.acl.owns(result.player_id)),
      state: state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.any') ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.own') && state.acl.owns(result.actor_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.assigned') && state.acl.owns(result.assignee_id)) ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'update.state.reported') && state.acl.owns(result.player_id)),
      delete: state.acl.hasServerPermission(serverId, 'player.reports', 'delete.any') ||
        (state.acl.hasServerPermission(serverId, 'player.reports', 'delete.assigned') && state.acl.owns(result.assignee_id))
    }
  }

  if (result.assignee_id) {
    data.assignee = {
      id: unparse(result.assignee_id), name: result.assignee_name
    }
  }

  return data
}
