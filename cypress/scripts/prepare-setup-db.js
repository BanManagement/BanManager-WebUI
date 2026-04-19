// Prepares a fresh pair of databases for the e2e-setup Cypress run.
//
// - WebUI DB (<SETUP_DB_NAME>): dropped; re-created when createWebui=true so
//   tests can flip between "use existing DB" and "create database if missing".
// - BM DB (<SETUP_BM_DB_NAME>): always recreated and seeded with the
//   bm_players row matching CONSOLE_UUID so verifyConsolePlayer succeeds.
//
// Operates exclusively on the throwaway names above — it never touches the
// developer's real WebUI DB.

const path = require('path')
const DBMigrate = require('db-migrate')
const { parse } = require('uuid-parse')
const knex = require('knex')
const { inetPton } = require('../../server/data/ip')

const ROOT = path.join(__dirname, '..', '..')
const CONSOLE_UUID = '00000000-0000-0000-0000-000000000001'

const resolvePassword = () => {
  if (process.env.SETUP_DB_PASSWORD == null) return process.env.DB_PASSWORD || ''
  return process.env.SETUP_DB_PASSWORD
}

const buildPool = (overrides = {}) => knex({
  client: 'mysql2',
  connection: {
    host: process.env.SETUP_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.SETUP_DB_PORT || process.env.DB_PORT || 3306),
    user: process.env.SETUP_DB_USER || process.env.DB_USER || 'root',
    password: resolvePassword(),
    multipleStatements: true,
    ...overrides
  }
})

const runMigrations = async (database, migrationsDir) => {
  const config = {
    connectionLimit: 1,
    host: process.env.SETUP_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.SETUP_DB_PORT || process.env.DB_PORT || 3306),
    user: process.env.SETUP_DB_USER || process.env.DB_USER || 'root',
    password: resolvePassword(),
    database,
    multipleStatements: true,
    driver: { require: '@confuser/db-migrate-mysql' }
  }
  const dbm = DBMigrate.getInstance(true, {
    throwUncatched: true,
    config: { dev: config },
    cmdOptions: { 'migrations-dir': migrationsDir }
  })
  dbm.silence(true)
  await dbm.up()
}

const prepareSetupDb = async ({
  webuiDb = process.env.SETUP_DB_NAME || 'bm_e2e_setup',
  bmDb = process.env.SETUP_BM_DB_NAME || 'bm_e2e_setup_bm',
  createWebui = false
} = {}) => {
  const admin = buildPool()
  try {
    await admin.raw(`DROP DATABASE IF EXISTS \`${webuiDb}\``)
    await admin.raw(`DROP DATABASE IF EXISTS \`${bmDb}\``)
    await admin.raw(`CREATE DATABASE \`${bmDb}\``)
    if (createWebui) await admin.raw(`CREATE DATABASE \`${webuiDb}\``)
  } finally {
    await admin.destroy().catch(() => {})
  }

  await runMigrations(bmDb, path.join(ROOT, 'server', 'test', 'migrations'))

  const bmPool = buildPool({ database: bmDb })
  try {
    const consoleId = parse(CONSOLE_UUID, Buffer.alloc(16))
    await bmPool('bm_players').insert({
      id: consoleId,
      name: 'Console',
      ip: inetPton('127.0.0.1'),
      lastSeen: Math.floor(Date.now() / 1000)
    })
  } finally {
    await bmPool.destroy().catch(() => {})
  }

  return { webuiDb, bmDb, consoleUuid: CONSOLE_UUID }
}

const dropSetupDbs = async ({
  webuiDb = process.env.SETUP_DB_NAME || 'bm_e2e_setup',
  bmDb = process.env.SETUP_BM_DB_NAME || 'bm_e2e_setup_bm'
} = {}) => {
  const admin = buildPool()
  try {
    await admin.raw(`DROP DATABASE IF EXISTS \`${webuiDb}\``)
    await admin.raw(`DROP DATABASE IF EXISTS \`${bmDb}\``)
  } finally {
    await admin.destroy().catch(() => {})
  }
  return null
}

module.exports = {
  CONSOLE_UUID,
  prepareSetupDb,
  dropSetupDbs
}
