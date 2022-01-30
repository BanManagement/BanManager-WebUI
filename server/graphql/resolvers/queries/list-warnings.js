const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function listPlayerWarnings (obj, { serverId, actor, player, limit = 10, offset, order }, { state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')
  if (limit > 50) throw new ExposedError('Limit too large')

  const server = state.serversPool.get(serverId)
  const tables = server.config.tables
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)
  const data = {}
  const filter = {}

  if (actor) {
    filter.actor_id = actor
  }

  if (player) {
    filter.player_id = player
  }

  if (fields.total) {
    const { total } = await server.pool(tables.playerWarnings)
      .select(server.pool.raw('COUNT(*) as total'))
      .where(filter)
      .first()

    data.total = total
  }

  if (fields.records) {
    const query = getSql(info.schema, server, fields.records, 'playerWarnings')
      .options({ nestTables: true })
      .where(filter)
      .limit(limit)
      .offset(offset)

    if (order) {
      query.orderByRaw(order.replace('_', ' '))
    }

    let calculateAcl = false

    if (fields.records.fieldsByTypeName.PlayerWarning.acl) {
      calculateAcl = true
      query.select('actor_id', 'player_id')
    }

    const results = await query.exec()

    data.records = results

    if (calculateAcl) {
      for (const result of results) {
        const acl = {
          update: state.acl.hasServerPermission(serverId, 'player.warnings', 'update.any') ||
          (state.acl.hasServerPermission(serverId, 'player.warnings', 'update.own') && state.acl.owns(result.actor_id)) ||
          (state.acl.hasServerPermission(serverId, 'player.warnings', 'update.any')) ||
          (state.acl.hasServerPermission(serverId, 'player.warnings', 'update.own') && state.acl.owns(result.actor_id)),
          delete: state.acl.hasServerPermission(serverId, 'player.warnings', 'delete.any') ||
          (state.acl.hasServerPermission(serverId, 'player.warnings', 'delete.own') && state.acl.owns(result.actor_id)) ||
          (state.acl.hasServerPermission(serverId, 'player.warnings', 'delete.any')) ||
          (state.acl.hasServerPermission(serverId, 'player.warnings', 'delete.own') && state.acl.owns(result.actor_id)),
          actor: state.acl.owns(result.actor_id),
          yours: state.acl.owns(result.player_id)
        }

        result.acl = acl
      }
    }
  }

  return data
}
