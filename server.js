const path = require('path')
const fs = require('fs')

const loadDotenv = () => {
  const dotenv = require('dotenv')

  if (process.env.DOTENV_CONFIG_PATH) {
    dotenv.config({ path: process.env.DOTENV_CONFIG_PATH, override: false })
  }

  const dockerEnv = path.join('/app', 'config', '.env')
  try {
    if (fs.existsSync(dockerEnv)) {
      dotenv.config({ path: dockerEnv, override: false })
    }
  } catch (_) {
    // ignore - dockerEnv lookup is best-effort
  }

  dotenv.config()
}

const createApp = require('./server/app')
const { setupPool, setupServersPool } = require('./server/connections')
const { cleanupOrphanDocuments } = require('./server/data/cleanup-documents')
const { getSetupState, SETUP_STATES, isSetupModeState, hasKeys, hasDbVars } = require('./server/setup/state')
const { validateEnv, formatValidationError } = require('./server/setup/env-validator')

const buildDbConfig = (env) => ({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  multipleStatements: false
})

// Decide which mode to boot in (setup-mode vs normal-mode) and build the
// matching koa app. Pure boot-decision logic, free of process.env/process.exit
// side effects so it can be exercised directly by jest.
//
// Returns either:
//   { mode: 'setup', app, setupState, warnings }
//   { mode: 'normal', app, dbPool, serversPool, warnings }
//   { mode: 'invalid-config', issues, warnings }  (caller should exit)
const decideBoot = async ({
  env,
  logger,
  createPool = setupPool,
  createServersPool = setupServersPool
} = {}) => {
  if (!hasKeys(env) || !hasDbVars(env)) {
    const setupState = await getSetupState(env, null)
    const validation = await validateEnv({ env, setupMode: true })

    const app = await createApp({ logger, setupMode: true, setupState })
    return { mode: 'setup', app, setupState, warnings: validation.warnings }
  }

  let dbPool
  try {
    dbPool = await createPool(buildDbConfig(env), logger)
    await dbPool.raw('SELECT 1+1 AS result')
  } catch (dbError) {
    if (dbPool) {
      try { await dbPool.destroy() } catch (_) {}
    }

    const setupValidation = await validateEnv({ env, setupMode: true })
    const app = await createApp({ logger, setupMode: true, setupState: SETUP_STATES.SETUP_DB_UNREACHABLE })
    return {
      mode: 'setup',
      app,
      setupState: SETUP_STATES.SETUP_DB_UNREACHABLE,
      warnings: setupValidation.warnings,
      dbError
    }
  }

  const setupState = await getSetupState(env, dbPool)

  if (isSetupModeState(setupState)) {
    const setupValidation = await validateEnv({ env, setupMode: true, dbPool })
    try { await dbPool.destroy() } catch (_) {}

    const app = await createApp({ logger, setupMode: true, setupState })
    return { mode: 'setup', app, setupState, warnings: setupValidation.warnings }
  }

  const validation = await validateEnv({ env, setupMode: false, dbPool })

  if (!validation.ok) {
    try { await dbPool.destroy() } catch (_) {}
    return { mode: 'invalid-config', issues: validation.issues, warnings: validation.warnings }
  }

  const serversPool = await createServersPool({ dbPool, logger })
  const app = await createApp({ dbPool, logger, serversPool, disableUI: env.DISABLE_UI === 'true' })

  return { mode: 'normal', app, dbPool, serversPool, warnings: validation.warnings }
}

const main = async () => {
  loadDotenv()

  const pino = require('pino')
  const logger = pino({
    name: 'banmanager-webui',
    level: process.env.LOG_LEVEL || 'debug',
    redact: {
      paths: ['req.headers.cookie', 'res.headers["set-cookie"]'],
      censor: '*******'
    }
  })

  const port = process.env.PORT || 3000

  const startListening = (app) => {
    if (process.env.HOSTNAME) {
      app.listen(port, process.env.HOSTNAME, () => logger.info(`Listening on ${process.env.HOSTNAME}:${port}`))
    } else {
      app.listen(port, () => logger.info(`Listening on ${port}`))
    }
  }

  try {
    const result = await decideBoot({ env: process.env, logger })

    if (result.warnings && result.warnings.length) {
      logger.warn({ warnings: result.warnings }, formatValidationError({ issues: [], warnings: result.warnings }))
    }

    if (result.mode === 'invalid-config') {
      logger.error({ issues: result.issues, warnings: result.warnings }, formatValidationError({ issues: result.issues, warnings: result.warnings }))
      process.exit(1)
    }

    if (result.mode === 'setup') {
      if (result.dbError) {
        logger.error({ err: result.dbError }, 'Database connection failed at boot. Starting in setup mode so config can be corrected via /setup. Hint: check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.')
      } else if (result.setupState !== SETUP_STATES.SETUP_NO_KEYS && result.setupState !== SETUP_STATES.SETUP_NO_DB) {
        logger.warn({ setupState: result.setupState }, 'Database connected but setup is incomplete. Booting in setup mode; visit /setup to finish installation.')
      }

      startListening(result.app)
      return
    }

    cleanupOrphanDocuments(result.dbPool, logger)
    setInterval(() => cleanupOrphanDocuments(result.dbPool, logger), 6 * 60 * 60 * 1000)

    startListening(result.app)
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { decideBoot, buildDbConfig, main }
