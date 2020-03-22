const DataLoader = require('dataloader')
const { uniq } = require('lodash')

module.exports = ({ state }, tableName, resource) => {
  const { serversPool } = state
  const serverPlayerId = new DataLoader(async (ids) => {
    const data = []
    let playerIds = []
    // Get all server ids
    const serverIds = ids.map(id => {
      playerIds.push(id.player)

      return id.server
    })

    playerIds = uniq(playerIds)

    for (const serverId of serverIds) {
      const server = serversPool.get(serverId)
      const serverData = Object.assign({}, server.config)
      const table = server.config.tables[tableName]

      let [rows] = await server.query('SELECT * FROM ?? WHERE player_id IN(?)', [table, playerIds])

      rows = await Promise.all(rows.map(async row => {
        const actor = await state.loaders.player.ids.load(row.actor_id)
        const acl =
          {
            update: state.acl.hasServerPermission(serverId, resource, 'update.any') ||
            (state.acl.hasServerPermission(serverId, resource, 'update.own') && state.acl.owns(row.actor_id)) ||
            (state.acl.hasServerPermission(serverId, resource, 'update.any')) ||
            (state.acl.hasServerPermission(serverId, resource, 'update.own') && state.acl.owns(row.actor_id)),
            delete: state.acl.hasServerPermission(serverId, resource, 'delete.any') ||
            (state.acl.hasServerPermission(serverId, resource, 'delete.own') && state.acl.owns(row.actor_id)) ||
            (state.acl.hasServerPermission(serverId, resource, 'delete.any')) ||
            (state.acl.hasServerPermission(serverId, resource, 'delete.own') && state.acl.owns(row.actor_id)),
            actor: state.acl.owns(row.actor_id),
            yours: state.acl.owns(row.player_id)
          }

        return { actor, acl, server: serverData, ...row }
      }))

      data.push(rows)
    }

    return data
  })

  const serverDataId = new DataLoader(async (ids) => {
    let data = []
    let punishmentIds = []
    // Get all server ids
    const serverIds = ids.map(id => {
      punishmentIds.push(parseInt(id.id, 10))

      return id.server
    })

    punishmentIds = uniq(punishmentIds)

    for (const serverId of serverIds) {
      const server = serversPool.get(serverId)
      const serverData = Object.assign({}, server.config)
      const table = server.config.tables[tableName]

      let [rows] = await server.query('SELECT * FROM ?? WHERE id IN(?)', [table, punishmentIds])

      rows = await Promise.all(rows.map(async row => {
        const actor = await state.loaders.player.ids.load(row.actor_id)
        const player = await state.loaders.player.ids.load(row.player_id)
        const acl =
          {
            update: state.acl.hasServerPermission(serverId, resource, 'update.any') ||
            (state.acl.hasServerPermission(serverId, resource, 'update.own') && state.acl.owns(row.actor_id)),
            delete: state.acl.hasServerPermission(serverId, resource, 'delete.any') ||
            (state.acl.hasServerPermission(serverId, resource, 'delete.own') && state.acl.owns(row.actor_id)),
            actor: state.acl.owns(row.actor_id),
            yours: state.acl.owns(row.player_id)
          }

        return { player, actor, server: serverData, acl, ...row }
      }))

      data = data.concat(rows)
    }

    return punishmentIds.map(id => data.find(row => row.id === id))
  })

  return {
    serverPlayerId, serverDataId
  }
}
