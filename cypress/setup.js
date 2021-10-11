require('dotenv').config()

const path = require('path')
const DBMigrate = require('db-migrate')
const { setupPool } = require('../server/connections')
const { createServer, createPlayer } = require('../server/test/fixtures')
const { hash } = require('../server/data/hash')

;(async () => { // eslint-disable-line max-statements
  const dbName = 'bm_e2e_tests'
  const dbConfig =
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    }
  let dbPool = await setupPool(dbConfig)

  await dbPool.raw(`CREATE DATABASE ${dbName}`)
  await dbPool.destroy()

  dbConfig.database = dbName

  console.log(`Using database ${dbName}`)

  // Recreate the pool, as USE DATABASE would only apply to one connection, not the whole pool?
  // @TODO Confirm above
  dbPool = await setupPool(dbConfig)

  // Run migrations, then 'test' migrations
  let dbmOpts = { config: { dev: { ...dbConfig, driver: 'mysql' } }, cmdOptions: { 'migrations-dir': path.join(__dirname, '..', 'server', 'data', 'migrations') } }
  let dbm = DBMigrate.getInstance(true, dbmOpts)

  dbm.silence(true)

  await dbm.up()

  dbmOpts = { config: { dev: { ...dbConfig, driver: 'mysql' } }, cmdOptions: { 'migrations-dir': path.join(__dirname, '..', 'server', 'test', 'migrations') } }
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

  await dbPool.destroy()
})().catch(error => console.error(error))
