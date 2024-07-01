const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')

module.exports = async function playerWarnings (obj, { player }, { state }, info) {
  const fields = parseResolveInfo(info)
  const calculateAcl = !!fields.fieldsByTypeName.PlayerWarning.acl
  const results = await Promise.all(Array.from(state.serversPool.values()).map(async (server) => {
    // @TODO PERMS CHEcK
    const query = getSql(info.schema, server, fields, 'playerWarnings')
      .where('player_id', player)

    if (calculateAcl) {
      query.select('actor_id', 'player_id')
    }

    const data = await query.exec()

    data.forEach(d => {
      if (calculateAcl) {
        d.acl = {
          update: state.acl.hasServerPermission(server.config.id, 'player.warnings', 'update.any') ||
          (state.acl.hasServerPermission(server.config.id, 'player.warnings', 'update.own') && state.acl.owns(d.actor_id)) ||
          (state.acl.hasServerPermission(server.config.id, 'player.warnings', 'update.any')) ||
          (state.acl.hasServerPermission(server.config.id, 'player.warnings', 'update.own') && state.acl.owns(d.actor_id)),
          delete: state.acl.hasServerPermission(server.config.id, 'player.warnings', 'delete.any') ||
          (state.acl.hasServerPermission(server.config.id, 'player.warnings', 'delete.own') && state.acl.owns(d.actor_id)) ||
          (state.acl.hasServerPermission(server.config.id, 'player.warnings', 'delete.any')) ||
          (state.acl.hasServerPermission(server.config.id, 'player.warnings', 'delete.own') && state.acl.owns(d.actor_id)),
          actor: state.acl.owns(d.actor_id),
          yours: state.acl.owns(d.player_id)
        }
      }

      if (fields.fieldsByTypeName.PlayerWarning.server) {
        d.server = server.config
      }
    })

    return data
  }))

  return results.reduce((prev, cur) => prev.concat(cur))
}
