const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function playerKick (obj, { id, serverId }, { state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')

  const server = state.serversPool.get(serverId)
  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, server, fields, 'playerKicks', 'PlayerKick')
    .where(`${server.config.tables.playerKicks}.id`, id)

  let calculateAcl = false

  if (fields.fieldsByTypeName.PlayerKick.acl) {
    calculateAcl = true
    query.select('actor_id', 'player_id')
  }

  const [data] = await query.exec()

  if (!data) return null

  if (fields.fieldsByTypeName.PlayerKick.server) {
    data.server = server.config
  }

  if (calculateAcl) {
    data.acl = {
      update: state.acl.hasServerPermission(serverId, 'player.kicks', 'update.any') ||
      (state.acl.hasServerPermission(serverId, 'player.kicks', 'update.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.kicks', 'update.any')) ||
      (state.acl.hasServerPermission(serverId, 'player.kicks', 'update.own') && state.acl.owns(data.actor_id)),
      delete: state.acl.hasServerPermission(serverId, 'player.kicks', 'delete.any') ||
      (state.acl.hasServerPermission(serverId, 'player.kicks', 'delete.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.kicks', 'delete.any')) ||
      (state.acl.hasServerPermission(serverId, 'player.kicks', 'delete.own') && state.acl.owns(data.actor_id)),
      actor: state.acl.owns(data.actor_id),
      yours: state.acl.owns(data.player_id)
    }
  }

  return data
}
