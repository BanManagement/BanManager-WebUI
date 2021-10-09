const ExposedError = require('../../../data/exposed-error')
const resources = require('./resources')

module.exports = async function me (obj, info, { session, state }) {
  if (!session || !session.playerId) throw new ExposedError('Invalid session')

  const [checkResult] = await state.dbPool('bm_web_users').select('email').where('player_id', session.playerId)
  const allResources = await resources(obj, info, { state });
  const servers = Array.from(state.serversPool.values()).map(server => server.config.id);

  allResources.forEach(resource => {
    resource.permissions.forEach(permission => {
      permission.allowed = state.acl.hasPermission(resource.name, permission.name)
      permission.serversAllowed = servers.filter(serverId => state.acl.hasServerPermission(serverId, resource.name, permission.name))
    })
  })

  const me = {
    ...await state.loaders.player.load({ id: session.playerId, fields: ['id', 'name'] }),
    hasAccount: !!checkResult,
    email: checkResult ? checkResult.email : null,
    session: {
      type: session.type
    },
    resources: allResources
  }

  return me
}
