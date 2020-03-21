const DataLoader = require('dataloader')
const { unparse, parse } = require('uuid-parse')
const { find } = require('lodash')

module.exports = (ctx) => {
  const ids = new DataLoader(async (unparsedIds) => {
    const parsedIds = unparsedIds.map(id => Buffer.isBuffer(id) ? id : parse(id, Buffer.alloc(16)))
    const players = {}

    // UUIDs could be sent without hyphens and in all caps, format them!
    unparsedIds = parsedIds.map(id => unparse(id))

    const servers = Array.from(ctx.state.serversPool.values())

    for (let i = 0; i < servers.length; i++) {
      const server = servers[i]
      const table = server.config.tables.players
      const [rows] = await server.query('SELECT * FROM ?? WHERE id IN(?)', [table, parsedIds])

      for (const player of rows) {
        const playerId = unparse(player.id)
        let cachedPlayer = players[playerId]

        if (!cachedPlayer) {
          cachedPlayer = {
            id: playerId,
            name: player.name,
            lastSeen: player.lastSeen,
            servers: []
          }

          players[playerId] = cachedPlayer
        }

        if (cachedPlayer.lastSeen < player.lastSeen) {
          cachedPlayer.lastSeen = player.lastSeen
          cachedPlayer.name = player.name
        }

        const now = Math.floor(Date.now() / 1000)
        const [[{ mysqlTime }]] = await server.execute(`SELECT (${now} - UNIX_TIMESTAMP()) AS mysqlTime`)
        const offset = mysqlTime > 0 ? Math.floor(mysqlTime) : Math.ceil(mysqlTime)
        const timeOffset = offset * 1000
        const serverData = { ...server.config, timeOffset }

        cachedPlayer.servers.push(
          {
            id: server.config.id,
            ip: player.ip,
            lastSeen: player.lastSeen,
            server: serverData,
            player
          })
      }
    }

    const data = unparsedIds.map(id => {
      const player = find(players, { id })

      return player || null
    })

    return data
  })

  return {
    ids
  }
}
