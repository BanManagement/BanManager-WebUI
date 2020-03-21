const { parse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function createPlayerMute (obj, { input }, { session, state }) {
  const server = state.serversPool.get(input.server)
  const table = server.config.tables.playerMutes
  const player = parse(input.player, Buffer.alloc(16))
  const actor = session.playerId
  const soft = input.soft ? 1 : 0
  let id

  try {
    const [result] = await server.execute(
      `INSERT INTO ${table}
        (player_id, actor_id, reason, created, updated, expires, soft)
          VALUES
        (?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), ?, ?)`
      , [player, actor, input.reason, input.expires, soft])

    id = result.insertId
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      throw new ExposedError('Player already muted on selected server, please unmute first')
    }

    throw e
  }

  const data = await state.loaders.playerMute.serverDataId.load({ server: input.server, id })

  return data
}
