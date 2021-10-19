const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function playerWarning (obj, { id, serverId }, { state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')

  const server = state.serversPool.get(serverId)
  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, server, fields, 'playerWarnings', 'PlayerWarning')
    .where(`${server.config.tables.playerWarnings}.id`, id)

  let calculateAcl = false

  if (fields.fieldsByTypeName.PlayerWarning.acl) {
    calculateAcl = true
    query.select('actor_id', 'player_id')
  }

  const [data] = await query.exec()

  if (!data) return null

  if (fields.fieldsByTypeName.PlayerWarning.server) {
    data.server = server.config
  }

  if (calculateAcl) {
    data.acl = {
      update: state.acl.hasServerPermission(serverId, 'player.warnings', 'update.any') ||
      (state.acl.hasServerPermission(serverId, 'player.warnings', 'update.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.warnings', 'update.any')) ||
      (state.acl.hasServerPermission(serverId, 'player.warnings', 'update.own') && state.acl.owns(data.actor_id)),
      delete: state.acl.hasServerPermission(serverId, 'player.warnings', 'delete.any') ||
      (state.acl.hasServerPermission(serverId, 'player.warnings', 'delete.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.warnings', 'delete.any')) ||
      (state.acl.hasServerPermission(serverId, 'player.warnings', 'delete.own') && state.acl.owns(data.actor_id)),
      actor: state.acl.owns(data.actor_id),
      yours: state.acl.owns(data.player_id)
    }
  }

  return data
}
