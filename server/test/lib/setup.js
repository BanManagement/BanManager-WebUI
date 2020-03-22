require('dotenv').config()

const path = require('path')
const pino = require('pino')
const { randomBytes } = require('crypto')
const DBMigrate = require('db-migrate')
const { setupPool, setupServersPool } = require('../../connections')
const { createServer, createPlayer } = require('../fixtures')
const loaders = require('../../graphql/loaders')
const { insert } = require('../../data/udify')
const { hash } = require('../../data/hash')

module.exports = async () => { // eslint-disable-line max-statements
  const dbName = 'bm_web_tests_' + randomBytes(4).toString('hex')
  const dbConfig =
    {
      connectionLimit: 1,
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      multipleStatements: true
    }
  const logger = pino(
    {
      name: 'banmanager-api-test',
      level: 'error'
    })
  let dbPool = await setupPool(dbConfig)

  await dbPool.execute(`CREATE DATABASE ${dbName}`)
  await dbPool.end()

  dbConfig.database = dbName

  console.log(`Using database ${dbName}`)

  // Recreate the pool, as USE DATABASE would only apply to one connection, not the whole pool?
  // @TODO Confirm above
  dbPool = await setupPool(dbConfig)

  // Run migrations, then 'test' migrations
  let dbmOpts = { config: { dev: { ...dbConfig, driver: 'mysql' } }, cmdOptions: { 'migrations-dir': path.join(__dirname, '..', '..', 'data', 'migrations') } }
  let dbm = DBMigrate.getInstance(true, dbmOpts)

  await dbm.up()

  dbmOpts = { config: { dev: { ...dbConfig, driver: 'mysql' } }, cmdOptions: { 'migrations-dir': path.join(__dirname, '..', 'migrations') } }
  dbm = DBMigrate.getInstance(true, dbmOpts)

  await dbm.up()

  // Create player console
  const playerConsole = createPlayer()
  // Create two users, logged in and admin
  const loggedInUser = createPlayer()
  const adminUser = createPlayer()

  await insert(dbPool, 'bm_players', [playerConsole, loggedInUser, adminUser])

  await insert(dbPool, 'bm_web_player_roles',
    [{ player_id: loggedInUser.id, role_id: 2 },
      { player_id: adminUser.id, role_id: 3 }
    ])

  const updated = Math.floor(Date.now() / 1000)

  await insert(dbPool, 'bm_web_users',
    [{ player_id: loggedInUser.id, email: 'user@banmanagement.com', password: await hash('testing'), updated },
      { player_id: adminUser.id, email: 'admin@banmanagement.com', password: await hash('testing'), updated }
    ])

  // Create a server
  const server = createServer(playerConsole.id, dbName)

  await insert(dbPool, 'bm_web_servers', server)

  const serversPool = await setupServersPool({ dbPool, logger, disableInterval: true })
  const teardown = async () => {
    for (const server of serversPool.values()) {
      await server.pool.end()
    }

    await dbPool.execute(`DROP DATABASE ${dbName}`)
    await dbPool.end()
  }

  return {
    dbPool,
    logger,
    serversPool,
    teardown,
    loaders: loaders({ state: { serversPool, dbPool } }),
    server
  }
}
