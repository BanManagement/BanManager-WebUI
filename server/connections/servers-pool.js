const { difference } = require('lodash')
const setupPool = require('./pool')
const { decrypt } = require('../data/crypto')

async function interval ({ servers, dbPool, logger }) {
  const rows = await dbPool('bm_web_servers')
  const newIds = await Promise.all(rows.map(async (server) => {
    server.tables = JSON.parse(server.tables)

    if (servers.has(server.id)) {
      // Check for modifications
      const currentServer = servers.get(server.id)
      const diff = JSON.stringify(currentServer.config) !== JSON.stringify(server) // @TODO Use isEqual, but currently causes infinite loop

      if (!diff) return server.id

      // @TODO Only modify pool if connection details have changed
      currentServer.pool.destroy().catch((error) => logger.error(error, 'servers-pool'))
    }

    let password

    if (server.password) {
      password = await decrypt(process.env.ENCRYPTION_KEY, server.password)
    }

    const poolConfig = {
      host: server.host,
      port: server.port,
      user: server.user,
      password: password,
      database: server.database
    }
    const pool = setupPool(poolConfig, logger)
    const serverDetails = {
      config: server,
      pool
    }

    logger.debug({ id: server.id }, 'Loaded server')

    servers.set(server.id, serverDetails)

    return server.id
  }))

  if (!newIds.length) return

  const leftOvers = difference(Array.from(servers.keys()), newIds)

  leftOvers.forEach((id) => {
    servers.get(id).pool.destroy()
      .catch((error) => logger.error(error, 'servers-pool'))
      .finally(() => {
        servers.delete(id)
        logger.debug({ id }, 'Removed server')
      })
  })

  return servers
}

module.exports = async ({ dbPool, logger, disableInterval = false }) => {
  const servers = new Map()

  // Run now
  await interval({ servers, dbPool, logger })

  // @TODO Inefficient, message bus/pub sub? Or alternatively, create server pool connections per request when needed?
  if (!disableInterval) setInterval(interval, 3000, { servers, dbPool, logger })

  return servers
}

module.exports.interval = interval
