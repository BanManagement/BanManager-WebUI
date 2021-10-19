const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function playerBan (obj, { id, serverId }, { state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')

  const server = state.serversPool.get(serverId)
  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, server, fields, 'playerBans', 'PlayerBan')
    .where(`${server.config.tables.playerBans}.id`, id)

  let calculateAcl = false

  if (fields.fieldsByTypeName.PlayerBan.acl) {
    calculateAcl = true
    query.select('actor_id', 'player_id')
  }

  const [data] = await query.exec()

  if (!data) return null

  if (fields.fieldsByTypeName.PlayerBan.server) {
    data.server = server.config
  }

  if (calculateAcl) {
    data.acl = {
      update: state.acl.hasServerPermission(serverId, 'player.bans', 'update.any') ||
      (state.acl.hasServerPermission(serverId, 'player.bans', 'update.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.bans', 'update.any')) ||
      (state.acl.hasServerPermission(serverId, 'player.bans', 'update.own') && state.acl.owns(data.actor_id)),
      delete: state.acl.hasServerPermission(serverId, 'player.bans', 'delete.any') ||
      (state.acl.hasServerPermission(serverId, 'player.bans', 'delete.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.bans', 'delete.any')) ||
      (state.acl.hasServerPermission(serverId, 'player.bans', 'delete.own') && state.acl.owns(data.actor_id)),
      actor: state.acl.owns(data.actor_id),
      yours: state.acl.owns(data.player_id)
    }
  }

  return data
}
