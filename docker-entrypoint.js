#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const CONFIG_DIR = process.env.WEBUI_CONFIG_DIR || '/app/config'
const CONFIG_DOTENV = path.join(CONFIG_DIR, '.env')
const APP_DOTENV = path.join('/app', '.env')

const log = (...args) => console.log('[entrypoint]', ...args)
const warn = (...args) => console.warn('[entrypoint]', ...args)

const ensureConfigDir = () => {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  } catch (e) {
    warn(`Could not create ${CONFIG_DIR}: ${e.message}`)
  }
}

const loadDotenvFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return false
    require('dotenv').config({ path: filePath, override: false })
    log(`Loaded environment from ${filePath}`)
    return true
  } catch (e) {
    warn(`Could not load ${filePath}: ${e.message}`)
    return false
  }
}

const loadEnv = () => {
  if (process.env.DOTENV_CONFIG_PATH) loadDotenvFile(process.env.DOTENV_CONFIG_PATH)
  loadDotenvFile(CONFIG_DOTENV)
  loadDotenvFile(APP_DOTENV)
}

const persistEnv = (changes, target = CONFIG_DOTENV) => {
  const editDotenv = require('edit-dotenv')

  let existing = ''
  try {
    if (fs.existsSync(target)) existing = fs.readFileSync(target, 'utf8')
  } catch (e) {
    warn(`Could not read ${target}: ${e.message}`)
  }

  const next = editDotenv(existing, changes)

  try {
    fs.writeFileSync(target, next, { mode: 0o600 })
    log(`Persisted ${Object.keys(changes).join(', ')} to ${target}`)
  } catch (e) {
    warn(`Could not write ${target}: ${e.message}. Generated keys WILL NOT survive restart unless persisted manually.`)
  }
}

const ensureKeys = async () => {
  const { generateKeys, isValidHexKey } = require('./server/setup/keys')

  const existingEncryption = isValidHexKey(process.env.ENCRYPTION_KEY) ? process.env.ENCRYPTION_KEY : undefined
  const existingSession = isValidHexKey(process.env.SESSION_KEY) ? process.env.SESSION_KEY : undefined
  const existingVapidPublic = process.env.NOTIFICATION_VAPID_PUBLIC_KEY || undefined
  const existingVapidPrivate = process.env.NOTIFICATION_VAPID_PRIVATE_KEY || undefined

  const allPresent = existingEncryption && existingSession && existingVapidPublic && existingVapidPrivate

  if (allPresent) {
    log('All keys present in environment, skipping generation')
    return
  }

  log('Generating missing keys...')

  const keys = await generateKeys({
    existing: {
      encryptionKey: existingEncryption,
      sessionKey: existingSession,
      vapidPublicKey: existingVapidPublic,
      vapidPrivateKey: existingVapidPrivate
    }
  })

  const changes = {}
  if (!existingEncryption) {
    process.env.ENCRYPTION_KEY = keys.encryptionKey
    changes.ENCRYPTION_KEY = keys.encryptionKey
  }
  if (!existingSession) {
    process.env.SESSION_KEY = keys.sessionKey
    changes.SESSION_KEY = keys.sessionKey
  }
  if (!existingVapidPublic) {
    process.env.NOTIFICATION_VAPID_PUBLIC_KEY = keys.vapidPublicKey
    changes.NOTIFICATION_VAPID_PUBLIC_KEY = keys.vapidPublicKey
  }
  if (!existingVapidPrivate) {
    process.env.NOTIFICATION_VAPID_PRIVATE_KEY = keys.vapidPrivateKey
    changes.NOTIFICATION_VAPID_PRIVATE_KEY = keys.vapidPrivateKey
  }

  if (Object.keys(changes).length) persistEnv(changes)
}

const hasDbConfig = () => Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME)

const waitForDatabase = async ({ retries = 30, delayMs = 2000 } = {}) => {
  if (!hasDbConfig()) return false

  const { validateDbConnection } = require('./server/setup/db')

  for (let attempt = 1; attempt <= retries; attempt++) {
    const result = await validateDbConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME
    })

    if (result.ok) {
      log(`Database reachable after attempt ${attempt}`)
      return true
    }

    if (attempt === 1) {
      log(`Database not reachable yet (will retry every ${delayMs}ms): ${result.error.message}`)
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  warn(`Database still unreachable after ${retries} attempts. The server will start in setup mode.`)
  return false
}

const runMigrationsIfPossible = async () => {
  if (!hasDbConfig()) {
    log('DB env vars missing — skipping migrations. Visit /setup to complete installation.')
    return
  }

  const { runMigrations } = require('./server/setup/migrations')

  try {
    log('Running database migrations...')
    await runMigrations({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME
    })
    log('Database migrations complete')
  } catch (e) {
    warn(`Migration failed: ${e.message}. The server will start anyway; visit /setup or run \`npx bmwebui doctor\` for details.`)
  }
}

const runDoctor = () => new Promise((resolve) => {
  if (!hasDbConfig()) {
    log('Skipping doctor preflight (DB not configured yet)')
    return resolve()
  }

  log('Running preflight (npx bmwebui doctor)...')
  const child = spawn(process.execPath, [path.join(__dirname, 'bin', 'run.js'), 'doctor'], {
    stdio: 'inherit',
    env: process.env
  })

  child.on('exit', (code) => {
    if (code !== 0) {
      warn(`Doctor reported issues (exit ${code}). Continuing startup so /setup remains reachable.`)
    }
    resolve()
  })
})

const main = async () => {
  ensureConfigDir()
  loadEnv()
  await ensureKeys()
  loadEnv() // re-load so newly persisted keys are visible if other tooling reads .env
  await waitForDatabase()
  await runMigrationsIfPossible()
  await runDoctor()

  log('Starting WebUI server...')

  require('./server.js')
}

main().catch((err) => {
  console.error('[entrypoint] Startup failed:', err)
  process.exit(1)
})
