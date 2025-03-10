require('dotenv').config()

const path = require('path')
const pino = require('pino')
const { randomBytes } = require('crypto')
const DBMigrate = require('db-migrate')
const { setupPool, setupServersPool } = require('../../connections')
const { createServer, createPlayer } = require('../fixtures')
const loaders = require('../../graphql/loaders')
const { hash } = require('../../data/hash')

module.exports = async (disableTestMigrations) => { // eslint-disable-line max-statements
  const dbName = 'bm_web_tests_' + randomBytes(4).toString('hex')
  const dbConfig =
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    }

  const logger = pino(
    {
      name: 'banmanager-api-test',
      level: 'info'
    })
  let dbPool = await setupPool({ ...dbConfig })

  await dbPool.raw(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await dbPool.destroy()

  dbConfig.database = dbName

  console.log(`Using database ${dbName}`)

  // Recreate the pool, as USE DATABASE would only apply to one connection, not the whole pool?
  // @TODO Confirm above
  dbPool = await setupPool({ ...dbConfig })

  // Run migrations, then 'test' migrations
  let dbmOpts = { throwUncatched: true, config: { dev: { ...dbConfig, driver: { require: '@confuser/db-migrate-mysql' } } }, cmdOptions: { 'migrations-dir': path.join(__dirname, '..', '..', 'data', 'migrations') } }
  let dbm = DBMigrate.getInstance(true, dbmOpts)

  dbm.silence(true)

  await dbm.up()

  dbmOpts = { throwUncatched: true, config: { dev: { ...dbConfig, driver: { require: '@confuser/db-migrate-mysql' } } }, cmdOptions: { 'migrations-dir': path.join(__dirname, '..', 'migrations') } }
  dbm = DBMigrate.getInstance(true, dbmOpts)

  dbm.silence(true)

  await dbm.up()

  // Create player console
  const playerConsole = createPlayer()
  // Create three users, guest, logged in and admin
  const guestUser = createPlayer()
  const loggedInUser = createPlayer()
  const adminUser = createPlayer()

  await dbPool('bm_players').insert([playerConsole, guestUser, loggedInUser, adminUser])

  await dbPool('bm_web_player_roles').insert([
    { player_id: guestUser.id, role_id: 1 },
    { player_id: loggedInUser.id, role_id: 2 },
    { player_id: adminUser.id, role_id: 3 }
  ])

  const updated = Math.floor(Date.now() / 1000)

  await dbPool('bm_web_users').insert([
    { player_id: guestUser.id, email: 'guest@banmanagement.com', password: await hash('testing'), updated },
    { player_id: loggedInUser.id, email: 'user@banmanagement.com', password: await hash('testing'), updated },
    { player_id: adminUser.id, email: 'admin@banmanagement.com', password: await hash('testing'), updated }
  ])

  // Create a server
  const server = await createServer(playerConsole.id, dbName)

  await dbPool('bm_web_servers').insert(server)

  const serversPool = await setupServersPool({ dbPool, logger, disableInterval: true })
  const teardown = async () => {
    for (const server of serversPool.values()) {
      await server.pool.destroy()
    }

    serversPool.clear()

    await dbPool.raw(`DROP DATABASE ${dbName}`)
    await dbPool.destroy()
  }

  return {
    dbConfig,
    dbPool,
    logger,
    serversPool,
    teardown,
    loaders: loaders({ state: { serversPool, dbPool } }),
    server,
    users: { guest: guestUser, loggedIn: loggedInUser, admin: adminUser }
  }
}
