require('dotenv').config()

const path = require('path')
const fs = require('fs')
const DBMigrate = require('db-migrate')
const { parse } = require('uuid-parse')
const { setupPool } = require('../server/connections')
const { createServer, createPlayer, createBan } = require('../server/test/fixtures')
const { hash } = require('../server/data/hash')
const { encrypt } = require('../server/data/crypto')

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

  await dbPool.raw(`DROP DATABASE IF EXISTS ${dbName}`)
  await dbPool.raw(`CREATE DATABASE ${dbName}`)
  await dbPool.destroy()

  dbConfig.database = dbName

  console.log(`Using database ${dbName}`)

  // Recreate the pool, as USE DATABASE would only apply to one connection, not the whole pool?
  // @TODO Confirm above
  dbPool = await setupPool(dbConfig)

  // Run migrations, then 'test' migrations
  const dbmConfig = {
    connectionLimit: 1,
    host: dbConfig.host,
    port: parseInt(dbConfig.port, 10) || 3306,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    multipleStatements: true,
    driver: { require: '@confuser/db-migrate-mysql' }
  }

  let dbmOpts = {
    throwUncatched: true,
    config: { dev: dbmConfig },
    cmdOptions: { 'migrations-dir': path.join(__dirname, '..', 'server', 'data', 'migrations') }
  }
  let dbm = DBMigrate.getInstance(true, dbmOpts)

  dbm.silence(true)

  await dbm.up()

  dbmOpts = {
    throwUncatched: true,
    config: { dev: dbmConfig },
    cmdOptions: { 'migrations-dir': path.join(__dirname, '..', 'server', 'test', 'migrations') }
  }
  dbm = DBMigrate.getInstance(true, dbmOpts)

  dbm.silence(true)

  await dbm.up()

  // Create player console
  const playerConsole = createPlayer()
  // Create three users, guest, logged in and admin
  const guestUser = createPlayer()
  const loggedInUser = createPlayer()
  const adminUser = createPlayer({ id: parse('ae51c849-3f2a-4a37-986d-55ed5b02307f', Buffer.alloc(16)), name: 'confuser' })

  await dbPool('bm_players').insert([playerConsole, guestUser, loggedInUser, adminUser])

  await dbPool('bm_web_player_roles').insert([
    { player_id: guestUser.id, role_id: 1 },
    { player_id: loggedInUser.id, role_id: 2 },
    { player_id: adminUser.id, role_id: 3 }
  ])

  const updated = Math.floor(Date.now() / 1000)

  // E2E test admin password - must match CYPRESS_admin_password in workflow and cypress.config.js
  // Hardcode directly to avoid any env var issues
  const e2eAdminPassword = 'xK9mQp2LvR7nS4jT'
  const e2eAdminEmail = 'admin@banmanagement.com'

  console.log('Creating admin user with email:', e2eAdminEmail)
  console.log('Admin password starts with:', e2eAdminPassword.substring(0, 4) + '...')
  console.log('Admin password length:', e2eAdminPassword.length)

  const adminPasswordHash = await hash(e2eAdminPassword)
  console.log('Admin password hash length:', adminPasswordHash.length)

  await dbPool('bm_web_users').insert([
    { player_id: guestUser.id, email: 'guest@banmanagement.com', password: await hash('testing'), updated },
    { player_id: loggedInUser.id, email: 'user@banmanagement.com', password: await hash('testing'), updated },
    { player_id: adminUser.id, email: e2eAdminEmail, password: adminPasswordHash, updated }
  ])

  // Verify the user was created correctly
  const [verifyUser] = await dbPool('bm_web_users').select('email', 'password').where('email', e2eAdminEmail)
  console.log('Verified user email:', verifyUser?.email)
  console.log('Verified user password hash length:', verifyUser?.password?.length)

  // Create a server
  const server = await createServer(playerConsole.id, dbName)

  // Encrypt the server password using the encryption key
  if (server.password && process.env.ENCRYPTION_KEY) {
    server.password = await encrypt(process.env.ENCRYPTION_KEY, server.password)
  }

  await dbPool('bm_web_servers').insert(server)

  // Create a ban for the admin user (to enable appeal testing with document uploads)
  const adminBan = createBan(adminUser, playerConsole)
  await dbPool('bm_player_bans').insert(adminBan)

  // Get the ban ID that was inserted (it's auto-incremented)
  const [banResult] = await dbPool('bm_player_bans').select('id').where({ player_id: adminUser.id }).limit(1)
  const banId = banResult.id

  // Write test fixture data to a JSON file for Cypress tests to use
  const fixtureData = {
    serverId: server.id,
    banId: banId
  }
  fs.writeFileSync(
    path.join(__dirname, 'fixtures', 'e2e-data.json'),
    JSON.stringify(fixtureData, null, 2)
  )

  console.log('E2E test data:', fixtureData)

  await dbPool.destroy()
})().catch(error => console.error(error))
