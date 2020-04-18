const playerNote = require('../queries/player-note')

module.exports = async function createPlayerNote (obj, { input }, { session, state }, info) {
  const server = state.serversPool.get(input.server)
  const table = server.config.tables.playerNotes
  const player = input.player
  const actor = session.playerId
  const [id] = await server.pool(table).insert({
    player_id: player,
    actor_id: actor,
    message: input.message,
    created: server.pool.raw('UNIX_TIMESTAMP()')
  }, ['id'])

  return playerNote(obj, { id, serverId: input.server }, { state }, info)
}
