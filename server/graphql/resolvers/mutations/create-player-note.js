const { parse } = require('uuid-parse')

module.exports = async function createPlayerNote (obj, { input }, { session, state }) {
  const server = state.serversPool.get(input.server)
  const table = server.config.tables.playerNotes
  const player = parse(input.player, Buffer.alloc(16))
  const actor = session.playerId

  const [{ insertId }] = await server.execute(
    `INSERT INTO ${table} (player_id, actor_id, message, created) VALUES(?, ?, ?, UNIX_TIMESTAMP())`
    , [player, actor, input.message])
  const data = await state.loaders.playerNote.serverDataId.load({ server: input.server, id: insertId })

  return data
}
