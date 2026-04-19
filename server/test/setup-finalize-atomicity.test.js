const fs = require('fs')
const os = require('os')
const path = require('path')
const supertest = require('supertest')
const { parse } = require('uuid-parse')

const createApp = require('../app')
const { SETUP_STATES } = require('../setup/state')
const { createAdminUser } = require('../setup/admin')
const { createFreshSetup } = require('./lib')
const { createPlayer } = require('./fixtures')

const ADMIN_ROLE_ID = 3
const VALID_UUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const ADMIN_PLAYER_UUID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const SECOND_ADMIN_UUID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'

const ENV_KEYS_TO_PROTECT = [
  'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'ENCRYPTION_KEY', 'SESSION_KEY',
  'NOTIFICATION_VAPID_PUBLIC_KEY', 'NOTIFICATION_VAPID_PRIVATE_KEY',
  'NODE_ENV', 'CONTACT_EMAIL', 'DOTENV_CONFIG_PATH'
]

const snapshotEnv = () => Object.fromEntries(ENV_KEYS_TO_PROTECT.map(k => [k, process.env[k]]))

const restoreEnv = (snapshot) => {
  if (!snapshot) return
  for (const [k, v] of Object.entries(snapshot)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
}

describe('setup finalize atomicity (real DB)', () => {
  let setup
  let server
  let request
  let tempEnvFile
  let envBackup

  const buildBody = ({ adminEmail = 'admin@example.com', adminPlayerUuid = ADMIN_PLAYER_UUID } = {}) => ({
    db: {
      host: setup.dbConfig.host,
      port: setup.dbConfig.port,
      user: setup.dbConfig.user,
      password: setup.dbConfig.password || '',
      database: setup.dbConfig.database
    },
    server: {
      name: 'TestServer',
      host: setup.dbConfig.host,
      port: setup.dbConfig.port,
      user: setup.dbConfig.user,
      password: setup.dbConfig.password || '',
      database: setup.dbConfig.database,
      console: VALID_UUID,
      tables: {}
    },
    admin: {
      email: adminEmail,
      password: 'longenough',
      playerUuid: adminPlayerUuid
    }
  })

  beforeAll(async () => {
    setup = await createFreshSetup({ namespace: 'bm_finalize_test' })

    // Insert a console player so verifyConsolePlayer succeeds during finalize
    const consolePlayer = createPlayer({ id: parse(VALID_UUID, Buffer.alloc(16)), name: 'Console' })
    await setup.dbPool('bm_players').insert(consolePlayer)
  }, 60000)

  afterAll(async () => {
    if (server && server.close) server.close()
    if (setup) await setup.teardown()
  }, 20000)

  beforeEach(async () => {
    envBackup = snapshotEnv()

    tempEnvFile = path.join(os.tmpdir(), `setup-finalize-${Date.now()}-${Math.random().toString(16).slice(2)}.env`)
    process.env.DOTENV_CONFIG_PATH = tempEnvFile

    await setup.dbPool('bm_web_player_roles').delete()
    await setup.dbPool('bm_web_users').delete()
    await setup.dbPool('bm_web_servers').delete()

    const app = await createApp({
      dbPool: null,
      logger: null,
      serversPool: null,
      disableUI: true,
      setupMode: true,
      setupState: SETUP_STATES.SETUP_NO_KEYS
    })

    server = app.listen()
    request = supertest(server)
  })

  afterEach(() => {
    if (server && server.close) server.close()
    try { if (fs.existsSync(tempEnvFile)) fs.unlinkSync(tempEnvFile) } catch (_) {}
    restoreEnv(envBackup)
  })

  test('successful finalize commits exactly one server row + one admin user', async () => {
    const res = await request.post('/api/setup/finalize').send(buildBody())

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const servers = await setup.dbPool('bm_web_servers').select('*')
    expect(servers).toHaveLength(1)
    expect(servers[0]).toMatchObject({
      name: 'TestServer',
      host: setup.dbConfig.host,
      database: setup.dbConfig.database,
      user: setup.dbConfig.user
    })

    const users = await setup.dbPool('bm_web_users').select('*')
    expect(users).toHaveLength(1)
    expect(users[0].email).toBe('admin@example.com')

    const roles = await setup.dbPool('bm_web_player_roles')
      .where('role_id', ADMIN_ROLE_ID)
      .select('*')
    expect(roles).toHaveLength(1)
    expect(roles[0].player_id).toEqual(parse(ADMIN_PLAYER_UUID, Buffer.alloc(16)))
  })

  test('rejects with 409 if an admin already exists (no second server inserted)', async () => {
    // Pre-create an admin via the same code path the installer uses
    await createAdminUser({
      email: 'first.admin@example.com',
      password: 'longenough',
      playerUuid: ADMIN_PLAYER_UUID,
      dbPool: setup.dbPool
    })

    const beforeServerCount = Number((await setup.dbPool('bm_web_servers').count('* as n').first()).n)

    const res = await request.post('/api/setup/finalize').send(buildBody({
      adminEmail: 'second.admin@example.com',
      adminPlayerUuid: SECOND_ADMIN_UUID
    }))

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already complete/i)

    const afterServerCount = Number((await setup.dbPool('bm_web_servers').count('* as n').first()).n)
    expect(afterServerCount).toBe(beforeServerCount)

    const adminUsers = await setup.dbPool('bm_web_users').select('email')
    expect(adminUsers.map(u => u.email).sort()).toEqual(['first.admin@example.com'])
  })

  test('email collision rolls back the server insert (no orphan bm_web_servers row)', async () => {
    // Pre-insert a user row matching the admin email but WITHOUT an admin role,
    // so the "admin already exists?" check passes and the transaction proceeds
    // until createAdminUser fails with CREATE_ADMIN_EMAIL_TAKEN.
    const otherPlayer = createPlayer()
    await setup.dbPool('bm_players').insert(otherPlayer)
    await setup.dbPool('bm_web_users').insert({
      email: 'collision@example.com',
      password: 'pre-existing-hash',
      player_id: otherPlayer.id,
      updated: Math.floor(Date.now() / 1000)
    })

    const res = await request.post('/api/setup/finalize').send(buildBody({
      adminEmail: 'collision@example.com',
      adminPlayerUuid: ADMIN_PLAYER_UUID
    }))

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/email/i)

    // Critical: bm_web_servers must be empty — the server insert inside the
    // transaction must have rolled back when createAdminUser threw
    const servers = await setup.dbPool('bm_web_servers').select('*')
    expect(servers).toHaveLength(0)

    // The pre-existing user row must still be there, untouched
    const users = await setup.dbPool('bm_web_users').select('email')
    expect(users.map(u => u.email)).toEqual(['collision@example.com'])

    // And no admin role was granted
    const adminRoles = await setup.dbPool('bm_web_player_roles')
      .where('role_id', ADMIN_ROLE_ID)
      .select('*')
    expect(adminRoles).toHaveLength(0)
  })
})
