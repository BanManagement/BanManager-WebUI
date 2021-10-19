const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function playerNote (obj, { id, serverId }, { state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')

  const server = state.serversPool.get(serverId)
  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, server, fields, 'playerNotes', 'PlayerNote')
    .where(`${server.config.tables.playerNotes}.id`, id)

  let calculateAcl = false

  if (fields.fieldsByTypeName.PlayerNote.acl) {
    calculateAcl = true
    query.select('actor_id', 'player_id')
  }

  const [data] = await query.exec()

  if (!data) return null

  if (fields.fieldsByTypeName.PlayerNote.server) {
    data.server = server.config
  }

  if (calculateAcl) {
    data.acl = {
      update: state.acl.hasServerPermission(serverId, 'player.notes', 'update.any') ||
      (state.acl.hasServerPermission(serverId, 'player.notes', 'update.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.notes', 'update.any')) ||
      (state.acl.hasServerPermission(serverId, 'player.notes', 'update.own') && state.acl.owns(data.actor_id)),
      delete: state.acl.hasServerPermission(serverId, 'player.notes', 'delete.any') ||
      (state.acl.hasServerPermission(serverId, 'player.notes', 'delete.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(serverId, 'player.notes', 'delete.any')) ||
      (state.acl.hasServerPermission(serverId, 'player.notes', 'delete.own') && state.acl.owns(data.actor_id)),
      actor: state.acl.owns(data.actor_id),
      yours: state.acl.owns(data.player_id)
    }
  }

  return data
}
