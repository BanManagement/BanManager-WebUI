const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const getServer = require('./server')
const ExposedError = require('../../../data/exposed-error')
const defaultTypes = {
  PlayerBanRecord: {
    table: 'playerBanRecords',
    resource: 'player.bans'
  },
  PlayerKick: {
    table: 'playerKicks',
    resource: 'player.kicks'
  },
  PlayerMuteRecord: {
    table: 'playerMuteRecords',
    resource: 'player.mutes'
  },
  PlayerNote: {
    table: 'playerNotes',
    resource: 'player.notes'
  },
  PlayerWarning: {
    table: 'playerWarnings',
    resource: 'player.warnings'
  }
}

module.exports = async function listPlayerPunishmentRecords (obj, { serverId, actor, player, type, limit, offset, order }, { state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')
  if (limit > 50) throw new ExposedError('Limit too large')
  if (!defaultTypes[type]) throw new ExposedError('Invalid type')

  const server = state.serversPool.get(serverId)
  const typeInfo = defaultTypes[type]
  const data = { server: await getServer(obj, { id: serverId }, { state }, info) }

  if (!state.acl.hasServerPermission(serverId, typeInfo.resource, 'view')) {
    data.total = 0
    data.records = []

    return data
  }

  const tables = server.config.tables
  const table = tables[typeInfo.table]
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)
  const filter = { player_id: player }

  if (actor) {
    filter.actor_id = actor
  }

  if (fields.total) {
    const { total } = await server.pool(table)
      .select(server.pool.raw('COUNT(*) as total'))
      .where(filter)
      .first()

    data.total = total
  }

  if (fields.records) {
    const query = getSql(info.schema, server, fields.records, typeInfo.table)
      .where(filter)
      .limit(limit)
      .offset(offset)

    if (order) {
      query.orderByRaw(order.replace('_', ' '))
    }

    let calculateAcl = false

    if (fields.records.fieldsByTypeName[type].acl) {
      calculateAcl = true
      query.select('actor_id', 'player_id')
    }

    const results = await query.exec()

    data.records = results

    for (const result of results) {
      result.__resolveType = type

      if (calculateAcl) {
        const acl = {
          update: state.acl.hasServerPermission(serverId, typeInfo.resource, 'update.any') ||
          (state.acl.hasServerPermission(serverId, typeInfo.resource, 'update.own') && state.acl.owns(result.actor_id)) ||
          (state.acl.hasServerPermission(serverId, typeInfo.resource, 'update.any')) ||
          (state.acl.hasServerPermission(serverId, typeInfo.resource, 'update.own') && state.acl.owns(result.actor_id)),
          delete: state.acl.hasServerPermission(serverId, typeInfo.resource, 'delete.any') ||
          (state.acl.hasServerPermission(serverId, typeInfo.resource, 'delete.own') && state.acl.owns(result.actor_id)) ||
          (state.acl.hasServerPermission(serverId, typeInfo.resource, 'delete.any')) ||
          (state.acl.hasServerPermission(serverId, typeInfo.resource, 'delete.own') && state.acl.owns(result.actor_id)),
          actor: state.acl.owns(result.actor_id),
          yours: state.acl.owns(result.player_id)
        }

        result.acl = acl
      }
    }
  }

  return data
}
