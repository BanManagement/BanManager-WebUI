const { parse } = require('uuid-parse')
const { find } = require('lodash')

module.exports = {
  Player: {
    name: {
      async resolve ({ id }, args, { state: { serversPool, loaders } }) {
        const results = await Promise.all(Array.from(serversPool.values()).map(async (server) => {
          const table = server.config.tables.players
          const [rows] = await server.execute(`SELECT * FROM ${table} WHERE id = ?`, [parse(id, Buffer.alloc(16))])

          return rows
        }))

        const [{ name }] = results.reduce((prev, cur) => prev.concat(cur))

        return name
      }
    },
    roles: {
      async resolve ({ id }, args, { state: { dbPool, loaders } }) {
        const [results] = await dbPool.execute('SELECT role_id FROM bm_web_player_roles WHERE player_id = ?',
          [parse(id, Buffer.alloc(16))])

        return loaders.role.ids.loadMany(results.map(row => row.role_id))
      }
    },
    serverRoles: {
      async resolve ({ id }, args, { state: { dbPool, loaders } }) {
        const [results] = await dbPool.execute('SELECT role_id, server_id FROM bm_web_player_server_roles WHERE player_id = ?',
          [parse(id, Buffer.alloc(16))])
        const roles = await loaders.role.ids.loadMany(results.map(row => row.role_id))

        return results.map(r => {
          return { server: { id: r.server_id }, role: find(roles, { id: r.role_id }) }
        })
      }
    },
    email: {
      async resolve ({ id }, args, { state: { dbPool } }) {
        const [[result]] = await dbPool.execute('SELECT email FROM bm_web_users WHERE player_id = ?',
          [parse(id, Buffer.alloc(16))])

        return result ? result.email : null
      }
    },
    lastSeen: {
      async resolve ({ id }, args, { state: { serversPool, loaders } }) {
        const results = await Promise.all(Array.from(serversPool.values()).map(async (server) => {
          const table = server.config.tables.players
          const [rows] = await server.execute(`SELECT * FROM ${table} WHERE id = ?`, [parse(id, Buffer.alloc(16))])

          return rows
        }))

        const [{ lastSeen }] = results.reduce((prev, cur) => prev.concat(cur))

        return lastSeen
      }
    }
  }
}
