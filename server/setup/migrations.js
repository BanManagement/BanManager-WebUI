const path = require('path')
const DBMigrate = require('db-migrate')

const MIGRATIONS_DIR = path.join(__dirname, '..', 'data', 'migrations')

const buildDbConfig = (config) => ({
  connectionLimit: 1,
  host: config.host,
  port: config.port ? Number(config.port) : 3306,
  user: config.user,
  password: config.password || '',
  database: config.database,
  multipleStatements: true,
  driver: { require: '@confuser/db-migrate-mysql' }
})

const buildInstance = (config, { migrationsDir = MIGRATIONS_DIR } = {}) => {
  return DBMigrate.getInstance(true, {
    throwUncatched: true,
    config: { dev: buildDbConfig(config) },
    cmdOptions: { 'migrations-dir': migrationsDir }
  })
}

const runMigrations = async (config, options = {}) => {
  const dbm = buildInstance(config, options)
  dbm.silence(true)
  await dbm.up()
}

// Counts applied vs available migrations.
// When `options.dbPool` is supplied, the existing pool is used (callers should
// prefer this — opening a fresh connection on every /health request is
// noticeably slower under load). Otherwise a temporary single-connection pool
// is created from `config` (kept for the CLI doctor command which has no
// long-lived pool of its own).
const checkMigrationStatus = async (config, options = {}) => {
  const fs = require('fs').promises
  const migrationsDir = options.migrationsDir || MIGRATIONS_DIR

  const files = await fs.readdir(migrationsDir)
  const migrationFiles = files.filter((file) => /\.js$/.test(file)).sort()

  if (!migrationFiles.length) return { applied: 0, pending: 0, total: 0, upToDate: true }

  const reuseExistingPool = Boolean(options.dbPool)
  let pool
  if (reuseExistingPool) {
    pool = options.dbPool
  } else {
    const setupPool = require('../connections/pool')
    pool = setupPool(
      {
        host: config.host,
        port: config.port ? Number(config.port) : 3306,
        user: config.user,
        password: config.password || '',
        database: config.database
      },
      undefined,
      { min: 1, max: 1 }
    )
  }

  try {
    const has = await pool.schema.hasTable('migrations')
    if (!has) {
      return { applied: 0, pending: migrationFiles.length, total: migrationFiles.length, upToDate: false }
    }

    const rows = await pool('migrations').select('name')
    const applied = rows.length
    const total = migrationFiles.length
    const pending = Math.max(0, total - applied)

    return { applied, pending, total, upToDate: pending === 0 }
  } finally {
    if (!reuseExistingPool) await pool.destroy().catch(() => {})
  }
}

module.exports = {
  MIGRATIONS_DIR,
  runMigrations,
  checkMigrationStatus
}
