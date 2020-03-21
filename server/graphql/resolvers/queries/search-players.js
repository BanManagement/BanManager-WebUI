const { unparse } = require('uuid-parse')
const { uniqBy } = require('lodash')

module.exports = async function searchPlayers (obj, { name, limit }, { state }) {
  name = name + '%'

  const results = await Promise.all(Array.from(state.serversPool.values()).map(async (server) => {
    const table = server.config.tables.players
    const [rows] = await server.execute(`SELECT * FROM ${table} WHERE name LIKE ? LIMIT ?`, [name, limit])

    return rows
  }))

  return uniqBy(results.reduce((prev, cur) => prev.concat(cur)).map((player) => {
    player.id = unparse(player.id)

    return player
  }), 'id')
}
