const { parse } = require('uuid-parse')

module.exports = async function createPlayerWarning (obj, { input }, { session, state }) {
  const server = state.serversPool.get(input.server)
  const table = server.config.tables.playerWarnings
  const player = parse(input.player, Buffer.alloc(16))
  const actor = session.playerId

  const [{ insertId }] = await server.execute(
    `INSERT INTO ${table}
      (player_id, actor_id, reason, created, expires, points, \`read\`)
        VALUES
      (?, ?, ?, UNIX_TIMESTAMP(), ?, ?, ?)`
    , [player, actor, input.reason, input.expires, input.points, 0])
  const data = await state.loaders.playerWarning.serverDataId.load({ server: input.server, id: insertId })

  return data
}
