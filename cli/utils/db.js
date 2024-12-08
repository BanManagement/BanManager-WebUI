const { setupPool, setupServersPool } = require('../../server/connections')

const createDbPools = async (logger) => {
  const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }
  const dbPool = setupPool(dbConfig, undefined, { min: 1, max: 5 })
  const serversPool = await setupServersPool({ dbPool, logger, disableInterval: true })

  return {
    dbPool,
    serversPool
  }
}

const teardownDbPools = async (dbPool, serversPool) => {
  dbPool.destroy()
  for (const server of serversPool.values()) {
    await server.pool.destroy()
  }
}

module.exports = {
  createDbPools,
  teardownDbPools
}
