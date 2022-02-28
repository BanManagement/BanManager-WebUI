const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function playerMute (obj, { id, serverId }, { state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')

  const server = state.serversPool.get(serverId)
  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, server, fields, 'playerMutes', 'PlayerMute')
    .where(`${server.config.tables.playerMutes}.id`, id)

  let calculateAcl = false

  if (fields.fieldsByTypeName.PlayerMute.acl) {
    calculateAcl = true
    query.select('actor_id', 'player_id')
  }

  const [data] = await query.exec()

  if (!data) return null

  if (fields.fieldsByTypeName.PlayerMute.server) {
    data.server = server.config
  }

  if (calculateAcl) {
    data.acl = {
      update: state.acl.hasServerPermission(serverId, 'player.mutes', 'update.any') ||
      (state.acl.hasServerPermission(serverId, 'player.mutes', 'update.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.mutes', 'update.any')) ||
      (state.acl.hasServerPermission(serverId, 'player.mutes', 'update.own') && state.acl.owns(data.actor_id)),
      delete: state.acl.hasServerPermission(serverId, 'player.mutes', 'delete.any') ||
      (state.acl.hasServerPermission(serverId, 'player.mutes', 'delete.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.mutes', 'delete.any')) ||
      (state.acl.hasServerPermission(serverId, 'player.mutes', 'delete.own') && state.acl.owns(data.actor_id)),
      actor: state.acl.owns(data.actor_id),
      yours: state.acl.owns(data.player_id)
    }
  }

  return data
}
