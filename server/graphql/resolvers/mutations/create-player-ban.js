const ExposedError = require('../../../data/exposed-error')
const playerBan = require('../queries/player-ban')

module.exports = async function createPlayerBan (obj, { input }, { session, state }, info) {
  const server = state.serversPool.get(input.server)
  const table = server.config.tables.playerBans
  const player = input.player
  const actor = session.playerId
  let id

  try {
    const [insertId] = await server.pool(table).insert({
      player_id: player,
      actor_id: actor,
      reason: input.reason,
      expires: input.expires,
      created: server.pool.raw('UNIX_TIMESTAMP()'),
      updated: server.pool.raw('UNIX_TIMESTAMP()')
    }, ['id'])

    id = insertId
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      throw new ExposedError('Player already banned on selected server, please unban first')
    }

    throw e
  }

  return playerBan(obj, { id, serverId: input.server }, { state }, info)
}
