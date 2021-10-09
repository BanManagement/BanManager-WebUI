const ExposedError = require('../../../data/exposed-error')
const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')

module.exports = async function deletePlayerBanRecord (obj, { id, serverId }, { state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server not found')

  const server = state.serversPool.get(serverId)
  const tables = server.config.tables
  const table = tables.playerBanRecords
  const [result] = await server.pool(table)
    .select('pastActor_id')
    .where({ id })

  if (!result) throw new ExposedError('Ban record not found')

  const canDelete = state.acl.hasServerPermission(serverId, 'player.bans', 'delete.any') ||
    (state.acl.hasServerPermission(serverId, 'player.bans', 'delete.own') && state.acl.owns(result.pastActor_id))

  if (!canDelete) {
    throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')
  }

  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, server, fields, 'playerBanRecords')
    .where(`${table}.id`, id)

  const [data] = await query.exec()

  if (!data) return null

  if (fields.fieldsByTypeName.PlayerBanRecord.server) {
    data.server = server.config
  }

  await server.pool(table).where({ id }).del()

  return data
}
