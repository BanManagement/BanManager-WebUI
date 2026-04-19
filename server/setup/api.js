const fs = require('fs').promises
const fsSync = require('fs')
const path = require('path')
const cryptoNode = require('crypto')
const editDotenv = require('edit-dotenv')
const { unparse } = require('uuid-parse')
const { isUUID, isEmail } = require('validator')
const { merge } = require('lodash')

const { tables: defaultTables } = require('../data/tables')
const { generateServerId } = require('../data/generator')
const crypto = require('../data/crypto')

const { generateKeys, isValidHexKey } = require('./keys')
const { validateDbConnection, ensureDatabase, normaliseConfig } = require('./db')
const { runMigrations } = require('./migrations')
const { verifyTables, verifyConsolePlayer } = require('./tables')
const { parseBanManagerConfig } = require('./parse-config')
const { createAdminUser } = require('./admin')
const { isSetupComplete } = require('./state')

const ADMIN_ROLE_ID = 3

const resolveDotenvTarget = () => {
  if (process.env.DOTENV_CONFIG_PATH) return process.env.DOTENV_CONFIG_PATH
  if (fsSync.existsSync('/app/config')) return '/app/config/.env'
  return path.join(process.cwd(), '.env')
}

const writeDotenv = async (changes, target = resolveDotenvTarget()) => {
  let existing = ''
  try { existing = await fs.readFile(target, 'utf8') } catch (_) {}
  const next = editDotenv(existing, changes)
  await fs.writeFile(target, next, { mode: 0o600 })
  return target
}

const loadDotenvIntoProcess = async (target = resolveDotenvTarget()) => {
  try {
    const content = await fs.readFile(target, 'utf8')
    const dotenv = require('dotenv')
    const parsed = dotenv.parse(content)
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] == null) process.env[key] = value
    }
  } catch (_) {
    // best-effort
  }
}

const buildDbConfig = (input) => normaliseConfig({
  host: input.host,
  port: input.port,
  user: input.user,
  password: input.password,
  database: input.database
})

const handlePreflight = async (ctx) => {
  ctx.body = {
    state: process.env.SETUP_TOKEN ? 'token_required' : 'ready',
    clientIp: ctx.request.ip,
    isSecure: ctx.request.secure,
    requireToken: Boolean(process.env.SETUP_TOKEN)
  }
}

const timingSafeStringEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) {
    cryptoNode.timingSafeEqual(bufA, bufA)
    return false
  }
  return cryptoNode.timingSafeEqual(bufA, bufB)
}

const handleToken = async (ctx) => {
  const expected = process.env.SETUP_TOKEN
  if (!expected) {
    ctx.body = { ok: true, message: 'Token not required' }
    return
  }
  const provided = (ctx.request.body && ctx.request.body.token) || ctx.get('X-Setup-Token')
  if (!provided || !timingSafeStringEqual(provided, expected)) {
    ctx.status = 401
    ctx.body = { error: 'Invalid setup token' }
    return
  }
  ctx.body = { ok: true }
}

const handleDatabase = async (ctx) => {
  const body = ctx.request.body || {}
  const config = buildDbConfig(body)

  if (!config.host || !config.user || !config.database) {
    ctx.status = 400
    ctx.body = { error: 'host, user and database are required' }
    return
  }

  let conn
  const initial = await validateDbConnection(config, { destroy: false })
  if (initial.ok) {
    conn = initial.conn
  } else if (body.createIfMissing) {
    const adminConfig = {
      ...config,
      user: body.adminUser || config.user,
      password: body.adminPassword != null && body.adminPassword !== '' ? body.adminPassword : config.password
    }
    delete adminConfig.database

    try {
      conn = await ensureDatabase(adminConfig, config.database)
    } catch (e) {
      ctx.status = 400
      ctx.body = { error: e.message }
      return
    }
  } else {
    ctx.status = 400
    ctx.body = {
      error: 'Could not connect to the database: ' + (initial.error && initial.error.message),
      hint: 'If the database does not exist yet, tick "Create database if missing" and provide a privileged user.'
    }
    return
  }

  try {
    await runMigrations(config)
  } catch (e) {
    await conn.destroy().catch(() => {})
    ctx.status = 500
    ctx.body = { error: 'Migrations failed: ' + e.message }
    return
  }

  await conn.destroy().catch(() => {})
  ctx.body = { ok: true }
}

const handleServer = async (ctx) => {
  const body = ctx.request.body || {}
  const mode = body.mode || 'manual'
  const result = { tables: { ...defaultTables }, consoleUuid: null }
  let connection = null

  if (mode === 'paste') {
    if (body.configYaml) {
      try {
        const parsed = await parseBanManagerConfig({ configYaml: body.configYaml, consoleYaml: body.consoleYaml || '' })
        if (parsed.databaseConfig) connection = parsed.databaseConfig
        if (parsed.tables) result.tables = parsed.tables
        if (parsed.consoleUuid) result.consoleUuid = parsed.consoleUuid
      } catch (e) {
        ctx.status = 400
        ctx.body = { error: 'Could not parse pasted YAML: ' + e.message }
        return
      }
    }
    if (!connection) {
      ctx.status = 400
      ctx.body = { error: 'Pasted config.yml does not contain databases.local section' }
      return
    }
  } else if (mode === 'path') {
    if (!body.configPath) {
      ctx.status = 400
      ctx.body = { error: 'A filesystem path is required' }
      return
    }
    try {
      const parsed = await parseBanManagerConfig(body.configPath)
      if (parsed.databaseConfig) connection = parsed.databaseConfig
      if (parsed.tables) result.tables = parsed.tables
      if (parsed.consoleUuid) result.consoleUuid = parsed.consoleUuid
    } catch (e) {
      ctx.status = 400
      ctx.body = { error: 'Could not load BanManager config: ' + e.message }
      return
    }
    if (!connection) {
      ctx.status = 400
      ctx.body = { error: 'BanManager config did not contain databases.local section. Please switch to manual entry.' }
      return
    }
  } else {
    if (!body.connection) {
      ctx.status = 400
      ctx.body = { error: 'Connection details are required' }
      return
    }
    connection = body.connection
    if (body.consoleUuid) result.consoleUuid = body.consoleUuid
    if (body.tables && typeof body.tables === 'object') {
      result.tables = merge({}, defaultTables, body.tables)
    }
  }

  if (!result.consoleUuid) {
    ctx.status = 400
    const hints = {
      paste: 'Make sure to paste console.yml so the UUID can be detected.',
      path: 'Make sure console.yml exists in the BanManager folder.'
    }
    const hint = hints[mode] || 'Paste the "uuid" value from BanManager/console.yml.'
    ctx.body = { error: 'Console UUID is required. ' + hint }
    return
  }

  const dbResult = await validateDbConnection(connection, { destroy: false })
  if (!dbResult.ok) {
    ctx.status = 400
    ctx.body = { error: 'Could not connect to BanManager database: ' + dbResult.error.message }
    return
  }

  const conn = dbResult.conn
  try {
    const tableCheck = await verifyTables(conn, result.tables)
    if (!tableCheck.ok) {
      ctx.status = 400
      ctx.body = {
        error: 'Some tables were not found in the BanManager database: ' + tableCheck.missing.map(m => m.table).join(', '),
        missingTables: tableCheck.missing.map(m => m.key)
      }
      return
    }

    const consoleCheck = await verifyConsolePlayer(conn, result.tables.players, result.consoleUuid)
    if (!consoleCheck.ok) {
      ctx.status = 400
      const reasons = {
        'invalid-uuid': 'the UUID is not in a valid format',
        'not-found': 'no row with that UUID exists in the players table. Make sure BanManager has started at least once'
      }
      const reasonText = reasons[consoleCheck.reason] || consoleCheck.reason
      ctx.body = { error: 'Console UUID could not be verified: ' + reasonText }
      return
    }

    ctx.body = {
      ok: true,
      connection,
      tables: result.tables,
      consoleUuid: result.consoleUuid,
      name: body.name || 'Server'
    }
  } finally {
    await conn.destroy().catch(() => {})
  }
}

const handleAdminPreflight = async (ctx) => {
  const body = ctx.request.body || {}
  const errors = []
  if (!body.email || !isEmail(body.email)) errors.push('A valid email address is required')
  if (!body.password || body.password.length < 6) errors.push('Password must be at least 6 characters')
  if (!body.playerUuid || !isUUID(body.playerUuid)) errors.push('A valid Minecraft player UUID is required')
  if (errors.length) {
    ctx.status = 400
    ctx.body = { error: errors.join('; ') }
    return
  }
  ctx.body = { ok: true }
}

const handleFinalize = async (ctx) => {
  const body = ctx.request.body || {}
  if (!body.db || !body.server || !body.admin) {
    ctx.status = 400
    ctx.body = { error: 'db, server and admin payloads are required' }
    return
  }

  const dbConfig = buildDbConfig(body.db)
  const serverConfig = buildDbConfig(body.server)

  const connection = await validateDbConnection(dbConfig, { destroy: false })
  if (!connection.ok) {
    ctx.status = 400
    ctx.body = { error: 'WebUI database is not reachable: ' + connection.error.message }
    return
  }
  const dbPool = connection.conn

  let serverConn
  try {
    const serverResult = await validateDbConnection(serverConfig, { destroy: false })
    if (!serverResult.ok) {
      ctx.status = 400
      ctx.body = { error: 'BanManager database is not reachable: ' + serverResult.error.message }
      return
    }
    serverConn = serverResult.conn

    const tablesInput = body.server.tables && Object.keys(body.server.tables).length ? body.server.tables : defaultTables
    const tables = merge({}, defaultTables, tablesInput)

    const tableCheck = await verifyTables(serverConn, tables)
    if (!tableCheck.ok) {
      ctx.status = 400
      ctx.body = { error: 'Tables missing from BanManager database: ' + tableCheck.missing.map(m => m.table).join(', ') }
      return
    }

    const consoleResult = await verifyConsolePlayer(serverConn, tables.players, body.server.console)
    if (!consoleResult.ok) {
      ctx.status = 400
      ctx.body = { error: 'Console UUID is invalid or missing in bm_players' }
      return
    }

    const keys = await generateKeys({
      existing: {
        encryptionKey: isValidHexKey(process.env.ENCRYPTION_KEY) ? process.env.ENCRYPTION_KEY : undefined,
        sessionKey: isValidHexKey(process.env.SESSION_KEY) ? process.env.SESSION_KEY : undefined,
        vapidPublicKey: process.env.NOTIFICATION_VAPID_PUBLIC_KEY || undefined,
        vapidPrivateKey: process.env.NOTIFICATION_VAPID_PRIVATE_KEY || undefined
      }
    })

    const serverPasswordCipher = body.server.password
      ? await crypto.encrypt(keys.encryptionKey, body.server.password)
      : ''

    const serverId = (await generateServerId()).toString('hex')
    const consoleBuffer = consoleResult.id

    try {
      await dbPool.transaction(async (trx) => {
        const adminExists = await trx('bm_web_player_roles')
          .where('role_id', ADMIN_ROLE_ID)
          .first()
        if (adminExists) {
          const conflict = new Error('Setup is already complete. Sign in instead, or use `npx bmwebui setup` to add additional servers.')
          conflict.status = 409
          throw conflict
        }

        await trx('bm_web_servers').delete()

        await trx('bm_web_servers').insert({
          id: serverId,
          name: body.server.name || 'Server',
          host: serverConfig.host,
          port: serverConfig.port || 3306,
          database: serverConfig.database,
          user: serverConfig.user,
          password: serverPasswordCipher,
          console: consoleBuffer,
          tables: JSON.stringify(tables)
        })

        await createAdminUser({
          email: body.admin.email,
          password: body.admin.password,
          playerUuid: body.admin.playerUuid,
          dbPool: trx
        })
      })
    } catch (e) {
      if (e.status === 409) {
        ctx.status = 409
        ctx.body = { error: e.message }
        return
      }
      if (e.code === 'CREATE_ADMIN_EMAIL_TAKEN' || e.code === 'CREATE_ADMIN_PLAYER_TAKEN') {
        ctx.status = 409
        ctx.body = { error: e.message }
        return
      }
      throw e
    }

    const envChanges = {
      DB_HOST: dbConfig.host,
      DB_PORT: String(dbConfig.port || 3306),
      DB_USER: dbConfig.user,
      DB_PASSWORD: dbConfig.password || '',
      DB_NAME: dbConfig.database,
      ENCRYPTION_KEY: keys.encryptionKey,
      SESSION_KEY: keys.sessionKey,
      NOTIFICATION_VAPID_PUBLIC_KEY: keys.vapidPublicKey,
      NOTIFICATION_VAPID_PRIVATE_KEY: keys.vapidPrivateKey,
      NODE_ENV: process.env.NODE_ENV || 'production',
      CONTACT_EMAIL: process.env.CONTACT_EMAIL || body.admin.email
    }

    const target = await writeDotenv(envChanges)
    await loadDotenvIntoProcess(target)

    const inDocker = Boolean(process.env.DOTENV_CONFIG_PATH || fsSync.existsSync('/app/config'))

    ctx.body = {
      ok: true,
      message: 'Setup complete. The server will restart momentarily.',
      restartedAutomatically: inDocker,
      envFile: target
    }

    if (inDocker && process.env.NODE_ENV !== 'test') {
      setTimeout(() => process.exit(0), 500).unref()
    }
  } finally {
    if (serverConn) await serverConn.destroy().catch(() => {})
    await dbPool.destroy().catch(() => {})
  }
}

const handleState = async (ctx) => {
  const dbPool = ctx.state && ctx.state.dbPool
  if (dbPool) {
    try {
      const complete = await isSetupComplete(dbPool)
      ctx.body = { status: complete ? 'normal' : 'setup_required' }
      return
    } catch (_) {}
  }
  ctx.body = { status: 'setup_required' }
}

module.exports = {
  ADMIN_ROLE_ID,
  unparse,
  resolveDotenvTarget,
  writeDotenv,
  loadDotenvIntoProcess,
  handlers: {
    preflight: handlePreflight,
    token: handleToken,
    database: handleDatabase,
    server: handleServer,
    adminPreflight: handleAdminPreflight,
    finalize: handleFinalize,
    state: handleState
  }
}
