const resources = require('./resources')

module.exports = async function me (obj, info, { session, state, log }) {
  const allResources = await resources(obj, info, { state })
  const servers = Array.from(state.serversPool.values()).map(server => server.config.id)

  allResources.forEach(resource => {
    resource.permissions.forEach(permission => {
      permission.allowed = state.acl.hasPermission(resource.name, permission.name)
      permission.serversAllowed = servers.filter(serverId => state.acl.hasServerPermission(serverId, resource.name, permission.name))
    })
  })

  if (!session || !session.playerId) {
    return {
      resources: allResources
    }
  }

  const [checkResult] = await state.dbPool('bm_web_users').select('email').where('player_id', session.playerId)
  let playerData = {}

  try {
    playerData = await state.loaders.player.load({ id: session.playerId, fields: ['id', 'name'] })
  } catch (e) {
    log.error(e, 'failed to load player')

    playerData = { id: session.playerId }
  }

  const me = {
    ...playerData,
    hasAccount: Boolean(checkResult?.email),
    email: checkResult ? checkResult.email : null,
    session: {
      type: session.type
    },
    resources: allResources
  }

  return me
}
