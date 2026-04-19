const Router = require('@koa/router')
const { isSetupComplete } = require('../setup/state')
const { checkMigrationStatus } = require('../setup/migrations')

let cachedVersion

const getVersion = () => {
  if (cachedVersion) return cachedVersion

  try {
    cachedVersion = require('../../package.json').version
  } catch (_) {
    cachedVersion = 'unknown'
  }

  return cachedVersion
}

const buildHealthRouter = ({ dbPool, setupMode = false, setupState = null } = {}) => {
  const router = new Router()

  router.get('/health', async (ctx) => {
    const version = getVersion()

    if (setupMode || !dbPool) {
      ctx.body = {
        status: 'setup_required',
        reason: setupState || 'setup_mode',
        version
      }
      return
    }

    try {
      await dbPool.raw('SELECT 1+1 AS result')
    } catch (error) {
      ctx.status = 503
      ctx.body = {
        status: 'db_unreachable',
        version,
        error: 'Database connection failed'
      }
      return
    }

    let admin = 'unknown'
    try {
      const complete = await isSetupComplete(dbPool)
      admin = complete ? 'present' : 'missing'
    } catch (_) {
      admin = 'unknown'
    }

    let migrations = 'unknown'
    try {
      const status = await checkMigrationStatus(undefined, { dbPool })
      migrations = status.upToDate ? 'up-to-date' : 'pending'
    } catch (_) {
      migrations = 'unknown'
    }

    ctx.body = {
      status: 'ok',
      version,
      migrations,
      admin
    }
  })

  return router
}

module.exports = buildHealthRouter
module.exports.getVersion = getVersion
