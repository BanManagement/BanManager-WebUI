const setupPool = require('../connections/pool')

const normaliseConfig = (config) => ({
  host: config.host,
  port: config.port ? Number(config.port) : 3306,
  user: config.user,
  password: config.password || '',
  database: config.database
})

const validateDbConnection = async (config, { destroy = true } = {}) => {
  const conn = setupPool(normaliseConfig(config), undefined, { min: 1, max: 1 })

  try {
    await conn.raw('SELECT 1+1 AS result')

    if (destroy) {
      await conn.destroy()
      return { ok: true }
    }

    return { ok: true, conn }
  } catch (error) {
    try {
      await conn.destroy()
    } catch (_) {
      // ignore teardown failures when the connection never opened
    }

    return { ok: false, error }
  }
}

const ensureDatabase = async (rootConfig, dbName) => {
  if (!dbName || typeof dbName !== 'string') {
    throw new Error('A database name must be provided to ensureDatabase')
  }

  if (!/^[A-Za-z0-9_$]{1,64}$/.test(dbName)) {
    throw new Error(
      `Invalid database name "${dbName}". Use only letters, numbers, underscores or $ (max 64 characters).`
    )
  }

  const safeName = dbName
  const adminConfig = { ...normaliseConfig(rootConfig) }
  delete adminConfig.database

  const adminPool = setupPool(adminConfig, undefined, { min: 1, max: 1 })

  try {
    await adminPool.raw(
      `CREATE DATABASE IF NOT EXISTS \`${safeName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
  } catch (error) {
    await adminPool.destroy().catch(() => {})

    const friendly = new Error(
      `Unable to create database "${dbName}" automatically. Insufficient privileges or invalid credentials. Please create the database manually and re-run setup. Original error: ${error.message}`
    )
    friendly.cause = error
    friendly.code = 'ENSURE_DATABASE_FAILED'
    throw friendly
  }

  await adminPool.destroy().catch(() => {})

  return setupPool({ ...normaliseConfig(rootConfig), database: dbName }, undefined, { min: 1, max: 5 })
}

module.exports = {
  normaliseConfig,
  validateDbConnection,
  ensureDatabase
}
