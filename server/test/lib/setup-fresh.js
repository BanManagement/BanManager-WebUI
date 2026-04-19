require('dotenv').config()

const path = require('path')
const pino = require('pino')
const { randomBytes } = require('crypto')
const DBMigrate = require('db-migrate')
const { setupPool } = require('../../connections')

const applyMigrations = async (dbConfig, migrationsDir) => {
  const dbm = DBMigrate.getInstance(true, {
    throwUncatched: true,
    config: { dev: { ...dbConfig, driver: { require: '@confuser/db-migrate-mysql' } } },
    cmdOptions: { 'migrations-dir': migrationsDir }
  })
  dbm.silence(true)
  await dbm.up()
}

module.exports = async ({ namespace = 'bm_setup_fresh', includeBanManagerTables = true } = {}) => {
  const dbName = `${namespace}_${randomBytes(4).toString('hex')}`
  const baseConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  }

  const logger = pino({ name: 'banmanager-api-test', level: 'info' })

  let dbPool = await setupPool({ ...baseConfig })
  await dbPool.raw(`CREATE DATABASE ${dbName}`)
  await dbPool.destroy()

  const dbConfig = { ...baseConfig, database: dbName }

  // Apply WebUI schema migrations (no seeded players, users or roles)
  await applyMigrations(dbConfig, path.join(__dirname, '..', '..', 'data', 'migrations'))

  // Optionally apply the test-only BanManager schema (bm_players, bm_player_bans, ...)
  // — needed for setup flows that call verifyTables / verifyConsolePlayer
  if (includeBanManagerTables) {
    await applyMigrations(dbConfig, path.join(__dirname, '..', 'migrations'))
  }

  dbPool = await setupPool({ ...dbConfig })

  const teardown = async () => {
    try { await dbPool.raw(`DROP DATABASE ${dbName}`) } catch (_) {}
    await dbPool.destroy().catch(() => {})
  }

  return { dbConfig, dbPool, dbName, logger, teardown }
}
