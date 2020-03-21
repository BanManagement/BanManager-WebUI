require('dotenv').config()
const requireEnv = require('require-environment-variables')

requireEnv(
  ['ENCRYPTION_KEY',
    'SESSION_KEY',
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_NAME',
    'DB_CONNECTION_LIMIT'
  ])

const logger = require('pino')(
  {
    name: 'banmanager-webui',
    level: process.env.LOG_LEVEL || 'debug'
  })
const createApp = require('./server/app')
const { setupPool, setupServersPool } = require('./server/connections')
const port = process.env.PORT || 3000
const dbConfig = {
  connectionLimit: process.env.DB_CONNECTION_LIMIT,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: false
}

;(async () => {
  try {
    const dbPool = await setupPool(dbConfig)
    const serversPool = await setupServersPool({ dbPool, logger })
    const app = await createApp({ dbPool, logger, serversPool, disableUI: process.env.DISABLE_UI === 'true' })

    app.listen(port, () => logger.info(`Listening on ${port}`))
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
})()
