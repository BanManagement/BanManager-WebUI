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

loadDotenv()

const pino = require('pino')
const createApp = require('./server/app')
const { setupPool, setupServersPool } = require('./server/connections')
const { cleanupOrphanDocuments } = require('./server/data/cleanup-documents')
const { getSetupState, SETUP_STATES, isSetupModeState, hasKeys, hasDbVars } = require('./server/setup/state')
const { validateEnv, formatValidationError } = require('./server/setup/env-validator')

const logger = pino(
  {
    name: 'banmanager-webui',
    level: process.env.LOG_LEVEL || 'debug',
    redact: {
      paths: ['req.headers.cookie', 'res.headers["set-cookie"]'],
      censor: '*******'
    }
  })

const port = process.env.PORT || 3000

const buildDbConfig = () => ({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: false
})

const startListening = (app) => {
  if (process.env.HOSTNAME) {
    app.listen(port, process.env.HOSTNAME, () => logger.info(`Listening on ${process.env.HOSTNAME}:${port}`))
  } else {
    app.listen(port, () => logger.info(`Listening on ${port}`))
  }
}

;(async () => {
  try {
    if (!hasKeys(process.env) || !hasDbVars(process.env)) {
      const setupState = await getSetupState(process.env, null)
      const validation = await validateEnv({ env: process.env, setupMode: true })

      if (validation.warnings.length) {
        logger.warn({ warnings: validation.warnings }, formatValidationError(validation))
      }

      const app = await createApp({ logger, setupMode: true, setupState })

      startListening(app)
      return
    }

    let dbPool
    try {
      dbPool = await setupPool(buildDbConfig(), logger)
      await dbPool.raw('SELECT 1+1 AS result')
    } catch (dbError) {
      logger.error({ err: dbError }, 'Database connection failed at boot. Starting in setup mode so config can be corrected via /setup. Hint: check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.')

      if (dbPool) {
        try { await dbPool.destroy() } catch (_) {}
      }

      const app = await createApp({ logger, setupMode: true, setupState: SETUP_STATES.SETUP_DB_UNREACHABLE })
      startListening(app)
      return
    }

    const validation = await validateEnv({ env: process.env, setupMode: false, dbPool })

    if (!validation.ok) {
      logger.error({ issues: validation.issues, warnings: validation.warnings }, formatValidationError(validation))
      try { await dbPool.destroy() } catch (_) {}
      process.exit(1)
    }

    if (validation.warnings.length) {
      logger.warn({ warnings: validation.warnings }, formatValidationError({ issues: [], warnings: validation.warnings }))
    }

    const setupState = await getSetupState(process.env, dbPool)

    if (isSetupModeState(setupState)) {
      logger.warn({ setupState }, 'Database connected but setup is incomplete. Booting in setup mode; visit /setup to finish installation.')
      try { await dbPool.destroy() } catch (_) {}

      const app = await createApp({ logger, setupMode: true, setupState })
      startListening(app)
      return
    }

    const serversPool = await setupServersPool({ dbPool, logger })
    const app = await createApp({ dbPool, logger, serversPool, disableUI: process.env.DISABLE_UI === 'true' })

    cleanupOrphanDocuments(dbPool, logger)
    setInterval(() => cleanupOrphanDocuments(dbPool, logger), 6 * 60 * 60 * 1000)

    startListening(app)
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
})()
