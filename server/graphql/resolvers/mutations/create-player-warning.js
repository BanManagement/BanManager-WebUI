const playerWarning = require('../queries/player-warning')

module.exports = async function createPlayerWarning (obj, { input }, { session, state }, info) {
  const server = state.serversPool.get(input.server)
  const table = server.config.tables.playerWarnings
  const player = input.player
  const actor = session.playerId
  const [id] = await server.pool(table).insert({
    player_id: player,
    actor_id: actor,
    reason: input.reason,
    expires: input.expires,
    points: input.points,
    read: 0,
    created: server.pool.raw('UNIX_TIMESTAMP()')
  }, ['id'])

  return playerWarning(obj, { id, serverId: input.server }, { state }, info)
}
