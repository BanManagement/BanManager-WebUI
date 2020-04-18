const ExposedError = require('../../../data/exposed-error')
const playerMute = require('../queries/player-mute')

module.exports = async function createPlayerMute (obj, { input }, { session, state }, info) {
  const server = state.serversPool.get(input.server)
  const table = server.config.tables.playerMutes
  const player = input.player
  const actor = session.playerId
  const soft = input.soft ? 1 : 0
  let id

  try {
    const [insertId] = await server.pool(table).insert({
      player_id: player,
      actor_id: actor,
      reason: input.reason,
      expires: input.expires,
      soft,
      created: server.pool.raw('UNIX_TIMESTAMP()'),
      updated: server.pool.raw('UNIX_TIMESTAMP()')
    }, ['id'])

    id = insertId
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      throw new ExposedError('Player already muted on selected server, please unmute first')
    }

    throw e
  }

  return playerMute(obj, { id, serverId: input.server }, { state }, info)
}
