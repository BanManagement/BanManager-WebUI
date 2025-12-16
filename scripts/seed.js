#!/usr/bin/env node

require('dotenv').config()

const path = require('path')
const DBMigrate = require('db-migrate')
const { parse } = require('uuid-parse')
const { setupPool } = require('../server/connections')
const {
  createServer,
  createPlayer,
  createBan,
  createBanRecord,
  createMute,
  createMuteRecord,
  createKick,
  createNote,
  createReport,
  createReportComment,
  createWarning,
  createAppeal
} = require('../server/test/fixtures')
const createAppealComment = require('../server/test/fixtures/appeal-comment')
const { hash } = require('../server/data/hash')

const DB_NAME = process.env.DB_NAME || 'bm_local_dev'
const FORCE = process.argv.includes('--force')

async function waitForMySQL (config, maxRetries = 30) {
  let retries = 0
  while (retries < maxRetries) {
    try {
      const pool = await setupPool(config)
      await pool.raw('SELECT 1')
      await pool.destroy()
      return true
    } catch (error) {
      retries++
      if (retries === maxRetries) {
        throw new Error(`Could not connect to MySQL after ${maxRetries} attempts. Is the database running?`)
      }
      console.log(`Waiting for MySQL... (attempt ${retries}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
}

async function seed () {
  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    multipleStatements: true
  }

  console.log('Connecting to MySQL...')
  await waitForMySQL(dbConfig)

  let dbPool = await setupPool(dbConfig)

  // Check if database exists
  const [databases] = await dbPool.raw(`SHOW DATABASES LIKE '${DB_NAME}'`)

  if (databases.length > 0) {
    if (!FORCE) {
      await dbPool.destroy()
      console.error(`\nError: Database '${DB_NAME}' already exists.`)
      console.error('Use --force flag to drop and recreate the database.')
      console.error('  npm run seed:reset')
      process.exit(1)
    }

    console.log(`Dropping existing database '${DB_NAME}'...`)
    await dbPool.raw(`DROP DATABASE ${DB_NAME}`)
  }

  console.log(`Creating database '${DB_NAME}'...`)
  await dbPool.raw(`CREATE DATABASE ${DB_NAME}`)
  await dbPool.destroy()

  dbConfig.database = DB_NAME
  dbPool = await setupPool(dbConfig)

  // Run WebUI migrations
  console.log('Running WebUI migrations...')
  const dbMigrateConfig = {
    connectionLimit: 1,
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: DB_NAME,
    multipleStatements: true,
    driver: { require: '@confuser/db-migrate-mysql' }
  }
  let dbmOpts = {
    throwUncatched: true,
    config: { dev: dbMigrateConfig },
    cmdOptions: { 'migrations-dir': path.join(__dirname, '..', 'server', 'data', 'migrations') }
  }
  let dbm = DBMigrate.getInstance(true, dbmOpts)
  dbm.silence(true)
  await dbm.up()

  // Run BanManager plugin migrations (test migrations)
  console.log('Running BanManager plugin migrations...')
  dbmOpts = {
    throwUncatched: true,
    config: { dev: dbMigrateConfig },
    cmdOptions: { 'migrations-dir': path.join(__dirname, '..', 'server', 'test', 'migrations') }
  }
  dbm = DBMigrate.getInstance(true, dbmOpts)
  dbm.silence(true)
  await dbm.up()

  console.log('Seeding data...')

  // Create console player (system account)
  const playerConsole = createPlayer({ name: 'Console' })

  // Create user accounts
  const guestUser = createPlayer({ name: 'GuestPlayer' })
  const loggedInUser = createPlayer({ name: 'RegularUser' })
  const adminUser = createPlayer({
    id: parse('ae51c849-3f2a-4a37-986d-55ed5b02307f', Buffer.alloc(16)),
    name: 'AdminUser'
  })

  // Create additional players for realistic data
  const players = [
    createPlayer({ name: 'Griefer123' }),
    createPlayer({ name: 'HackerNoob' }),
    createPlayer({ name: 'ToxicPlayer' }),
    createPlayer({ name: 'SpamBot' }),
    createPlayer({ name: 'CheatEngine' }),
    createPlayer({ name: 'RuleBreaker' }),
    createPlayer({ name: 'GoodPlayer' }),
    createPlayer({ name: 'NewPlayer' }),
    createPlayer({ name: 'VeteranUser' }),
    createPlayer({ name: 'ModHelper' })
  ]

  await dbPool('bm_players').insert([playerConsole, guestUser, loggedInUser, adminUser, ...players])
  console.log('  - Created 14 players')

  // Assign roles
  await dbPool('bm_web_player_roles').insert([
    { player_id: guestUser.id, role_id: 1 },
    { player_id: loggedInUser.id, role_id: 2 },
    { player_id: adminUser.id, role_id: 3 }
  ])
  console.log('  - Assigned roles')

  // Create user accounts
  const adminEmail = process.env.ADMIN_USERNAME || 'admin@banmanagement.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'testing'
  const updated = Math.floor(Date.now() / 1000)

  await dbPool('bm_web_users').insert([
    { player_id: guestUser.id, email: 'guest@banmanagement.com', password: await hash('testing'), updated },
    { player_id: loggedInUser.id, email: 'user@banmanagement.com', password: await hash('testing'), updated },
    { player_id: adminUser.id, email: adminEmail, password: await hash(adminPassword), updated }
  ])
  console.log('  - Created user accounts')

  // Create server
  const server = await createServer(playerConsole.id, DB_NAME)
  await dbPool('bm_web_servers').insert(server)
  console.log('  - Created server connection')

  // Create active bans
  const activeBans = [
    createBan(players[0], adminUser),
    createBan(players[1], adminUser),
    createBan(players[4], playerConsole)
  ]
  const insertedBans = await dbPool('bm_player_bans').insert(activeBans)
  activeBans.forEach((ban, i) => { ban.id = insertedBans[0] + i })
  console.log('  - Created 3 active bans')

  // Create ban records (historical bans)
  const banRecords = [
    createBanRecord(players[2], adminUser),
    createBanRecord(players[3], adminUser),
    createBanRecord(players[5], playerConsole),
    createBanRecord(players[6], adminUser),
    createBanRecord(players[7], adminUser)
  ]
  await dbPool('bm_player_ban_records').insert(banRecords)
  console.log('  - Created 5 ban records')

  // Create active mutes
  const activeMutes = [
    createMute(players[2], adminUser),
    createMute(players[3], playerConsole)
  ]
  const insertedMutes = await dbPool('bm_player_mutes').insert(activeMutes)
  activeMutes.forEach((mute, i) => { mute.id = insertedMutes[0] + i })
  console.log('  - Created 2 active mutes')

  // Create mute records
  const muteRecords = [
    createMuteRecord(players[0], adminUser),
    createMuteRecord(players[1], adminUser),
    createMuteRecord(players[5], playerConsole)
  ]
  await dbPool('bm_player_mute_records').insert(muteRecords)
  console.log('  - Created 3 mute records')

  // Create kicks
  const kicks = [
    createKick(players[0], adminUser),
    createKick(players[1], adminUser),
    createKick(players[2], playerConsole),
    createKick(players[3], adminUser),
    createKick(players[7], adminUser)
  ]
  await dbPool('bm_player_kicks').insert(kicks)
  console.log('  - Created 5 kicks')

  // Create warnings
  const warnings = [
    createWarning(players[0], adminUser),
    createWarning(players[1], adminUser),
    createWarning(players[2], adminUser),
    createWarning(players[5], playerConsole),
    createWarning(players[6], adminUser),
    createWarning(players[7], adminUser),
    createWarning(players[8], adminUser)
  ]
  await dbPool('bm_player_warnings').insert(warnings)
  console.log('  - Created 7 warnings')

  // Create notes
  const notes = [
    createNote(players[0], adminUser),
    createNote(players[1], adminUser),
    createNote(players[5], playerConsole)
  ]
  await dbPool('bm_player_notes').insert(notes)
  console.log('  - Created 3 notes')

  // Create reports with different states
  const reports = [
    createReport(players[0], players[6], null, 1), // Open
    createReport(players[1], players[7], adminUser, 2), // Assigned
    createReport(players[2], players[8], null, 3), // Resolved
    createReport(players[3], players[9], null, 4) // Closed
  ]
  const insertedReports = await dbPool('bm_player_reports').insert(reports)
  const firstReportId = insertedReports[0]
  console.log('  - Created 4 reports')

  // Create report comments
  const reportComments = [
    createReportComment(firstReportId, adminUser),
    createReportComment(firstReportId, players[6]),
    createReportComment(firstReportId + 1, adminUser)
  ]
  await dbPool('bm_player_report_comments').insert(reportComments)
  console.log('  - Created 3 report comments')

  // Create appeals with different states
  const appeals = [
    createAppeal(activeBans[0], 'ban', server, players[0], null, 1), // Open
    createAppeal(activeBans[1], 'ban', server, players[1], adminUser, 2), // Assigned
    createAppeal(activeMutes[0], 'mute', server, players[2], null, 3), // Resolved
    createAppeal(activeMutes[1], 'mute', server, players[3], null, 4) // Rejected
  ]
  const insertedAppeals = await dbPool('bm_web_appeals').insert(appeals)
  const firstAppealId = insertedAppeals[0]
  console.log('  - Created 4 appeals')

  // Create appeal comments
  const appealComments = [
    createAppealComment(firstAppealId, players[0]),
    createAppealComment(firstAppealId, adminUser),
    createAppealComment(firstAppealId + 1, players[1]),
    createAppealComment(firstAppealId + 1, adminUser)
  ]
  await dbPool('bm_web_appeal_comments').insert(appealComments.map(c => ({ ...c, type: 0 })))
  console.log('  - Created 4 appeal comments')

  await dbPool.destroy()

  console.log('\n✓ Database seeded successfully!')
  console.log(`\nDatabase: ${DB_NAME}`)
  console.log('\nTest accounts:')
  console.log('  Guest:  guest@banmanagement.com / testing')
  console.log('  User:   user@banmanagement.com / testing')
  console.log(`  Admin:  ${adminEmail} / ${adminPassword}`)
  console.log('\nStart the development server with: npm run dev')
}

seed().catch(error => {
  console.error('Seed failed:', error)
  process.exit(1)
})
