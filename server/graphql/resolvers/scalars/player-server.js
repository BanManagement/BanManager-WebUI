const { unparse } = require('uuid-parse')

module.exports =
{
  PlayerServer:
  {
    acl:
    {
      resolve ({ server: { id } }, args, { state: { acl } }) {
        const types = ['bans', 'kicks', 'mutes', 'notes', 'warnings']
        const data = {}

        types.forEach(type => {
          const resource = 'player.' + type

          data[type] = {
            create: acl.hasServerPermission(id, resource, 'create') || acl.hasPermission(resource, 'create'),
            update: acl.hasServerPermission(id, resource, 'update.any') || acl.hasPermission(resource, 'update.any'),
            delete: acl.hasServerPermission(id, resource, 'delete.any') || acl.hasPermission(resource, 'delete.any')
          }
        })

        return data
      }
    },
    bans:
    {
      async resolve (obj, args, { state }) {
        return state.loaders.playerBan.serverPlayerId.load({ server: obj.server.id, player: obj.player.id })
      }
    },
    kicks:
    {
      async resolve (obj, args, { state }) {
        return state.loaders.playerKick.serverPlayerId.load({ server: obj.server.id, player: obj.player.id })
      }
    },
    mutes:
    {
      async resolve (obj, args, { state }) {
        return state.loaders.playerMute.serverPlayerId.load({ server: obj.server.id, player: obj.player.id })
      }
    },
    notes:
    {
      async resolve (obj, args, { state }) {
        return state.loaders.playerNote.serverPlayerId.load({ server: obj.server.id, player: obj.player.id })
      }
    },
    warnings:
    {
      async resolve (obj, args, { state }) {
        return state.loaders.playerWarning.serverPlayerId.load({ server: obj.server.id, player: obj.player.id })
      }
    },
    history:
    {
      async resolve ({ server: { id: serverId }, player: { id: playerId } }, args, { state }) {
        const server = state.serversPool.get(serverId)
        const tables = server.config.tables
        const query = `
          SELECT
            id, ip, \`join\`, \`leave\`
          FROM
            ${tables.playerHistory}
          WHERE
            player_id = ?`
        const [history] = await server.execute(query, [playerId])

        return history
      }
    },
    alts:
    {
      async resolve ({ server: { id: serverId }, player: { id, ip } }, args, { state }) {
        const server = state.serversPool.get(serverId)
        const tables = server.config.tables
        const query = `
          SELECT
            id, name, lastSeen
          FROM
            ${tables.players}
          WHERE
            ip = ? AND id != ?`
        let [alts] = await server.execute(query, [ip, id])

        alts = alts.map(alt => ({ id: unparse(alt.id), name: alt.name, lastSeen: alt.lastSeen }))

        return alts
      }
    }
  }
}
