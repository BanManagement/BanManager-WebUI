const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')

module.exports = async function playerMutes (obj, { player }, { state }, info) {
  const fields = parseResolveInfo(info)
  const calculateAcl = !!fields.fieldsByTypeName.PlayerMute.acl
  const results = await Promise.all(Array.from(state.serversPool.values()).map(async (server) => {
    // @TODO PERMS CHEcK
    const query = getSql(info.schema, server, fields, 'playerMutes')
      .where('player_id', player)

    if (calculateAcl) {
      query.select('actor_id', 'player_id')
    }

    const data = await query.exec()

    data.forEach(d => {
      if (calculateAcl) {
        d.acl = {
          update: state.acl.hasServerPermission(server.config.id, 'player.mutes', 'update.any') ||
          (state.acl.hasServerPermission(server.config.id, 'player.mutes', 'update.own') && state.acl.owns(d.actor_id)) ||
          (state.acl.hasServerPermission(server.config.id, 'player.mutes', 'update.any')) ||
          (state.acl.hasServerPermission(server.config.id, 'player.mutes', 'update.own') && state.acl.owns(d.actor_id)),
          delete: state.acl.hasServerPermission(server.config.id, 'player.mutes', 'delete.any') ||
          (state.acl.hasServerPermission(server.config.id, 'player.mutes', 'delete.own') && state.acl.owns(d.actor_id)) ||
          (state.acl.hasServerPermission(server.config.id, 'player.mutes', 'delete.any')) ||
          (state.acl.hasServerPermission(server.config.id, 'player.mutes', 'delete.own') && state.acl.owns(d.actor_id)),
          actor: state.acl.owns(d.actor_id),
          yours: state.acl.owns(d.player_id)
        }
      }

      if (fields.fieldsByTypeName.PlayerMute.server) {
        d.server = server.config
      }
    })

    return data
  }))

  return results.reduce((prev, cur) => prev.concat(cur))
}
