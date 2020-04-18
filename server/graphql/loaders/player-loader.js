const DataLoader = require('dataloader')
const { unparse } = require('uuid-parse')
const { uniq } = require('lodash')

module.exports = (ctx) => {
  const ids = new DataLoader(async (keys) => {
    const ids = []
    let fields = ['id']

    for (const key of keys) {
      ids.push(key.id)

      fields = fields.concat(key.fields)
    }

    fields = uniq(fields)

    const players = new Map()
    for (const server of ctx.state.serversPool.values()) {
      const table = server.config.tables.players
      const rows = await server.pool(table)
        .select(fields)
        .whereIn('id', ids)

      for (const player of rows) {
        const id = unparse(player.id)
        const cachedPlayer = players.get(id)

        if (!cachedPlayer) {
          players.set(id, player)
        } else {
          if (cachedPlayer.lastSeen < player.lastSeen) {
            cachedPlayer.lastSeen = player.lastSeen
            cachedPlayer.name = player.name

            players.set(id, cachedPlayer)
          }
        }
      }
    }

    const data = ids.map(id => players.get(unparse(id)))

    return data
  })

  return ids
}
