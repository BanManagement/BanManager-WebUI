// `server.js`'s decideBoot picks setup-mode vs normal-mode at startup.
//
// Regression coverage for a crash-loop bug seen in the production Docker
// compose stack: when DB+keys were present but no admin had been created yet
// (i.e. fresh `docker compose up` before the operator visited /setup), the
// non-setup env validator fired first and `process.exit(1)`'d on missing
// CONTACT_EMAIL — before getSetupState got a chance to detect SETUP_NO_ADMIN
// and boot the wizard. The container kept restarting and /health never
// became reachable.
//
// The fix is to consult getSetupState first and validate in *setup* mode
// when setup is incomplete (warnings, not hard errors).

const supertest = require('supertest')
const { decideBoot } = require('../../server')
const { createFreshSetup } = require('./lib')
const { hash } = require('../data/hash')
const { ADMIN_ROLE_ID } = require('../setup/admin')
const { createPlayer, createServer } = require('./fixtures')
const { SETUP_STATES } = require('../setup/state')

const validKey = 'a'.repeat(64)

describe('server.js decideBoot', () => {
  let setup

  beforeAll(async () => {
    setup = await createFreshSetup({ namespace: 'bm_boot_decision_test' })
  }, 60000)

  afterAll(async () => {
    if (setup) await setup.teardown()
  }, 20000)

  beforeEach(async () => {
    await setup.dbPool('bm_web_player_roles').delete()
    await setup.dbPool('bm_web_users').delete()
    await setup.dbPool('bm_web_servers').delete()
  })

  const baseEnv = () => ({
    ENCRYPTION_KEY: validKey,
    SESSION_KEY: validKey,
    DB_HOST: setup.dbConfig.host,
    DB_PORT: String(setup.dbConfig.port),
    DB_USER: setup.dbConfig.user,
    DB_PASSWORD: setup.dbConfig.password,
    DB_NAME: setup.dbConfig.database,
    NOTIFICATION_VAPID_PUBLIC_KEY: 'pub',
    NOTIFICATION_VAPID_PRIVATE_KEY: 'priv'
    // CONTACT_EMAIL intentionally omitted — see file header
  })

  test('boots in setup-mode (not invalid-config) when no admin exists, even with CONTACT_EMAIL missing', async () => {
    const result = await decideBoot({ env: baseEnv() })

    expect(result.mode).toBe('setup')
    expect(result.setupState).toBe(SETUP_STATES.SETUP_NO_ADMIN)
    expect(result.warnings.map((w) => w.key)).toContain('CONTACT_EMAIL')

    const res = await supertest(result.app.callback()).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('setup_required')
    expect(res.body.reason).toBe(SETUP_STATES.SETUP_NO_ADMIN)
  }, 30000)

  test('returns invalid-config when setup IS complete but a required prod env var is missing', async () => {
    const player = createPlayer()
    await setup.dbPool('bm_players').insert(player)
    await setup.dbPool('bm_web_users').insert({
      email: 'admin@example.com',
      password: await hash('longenough'),
      player_id: player.id,
      updated: Math.floor(Date.now() / 1000)
    })
    await setup.dbPool('bm_web_player_roles').insert({ player_id: player.id, role_id: ADMIN_ROLE_ID })
    await setup.dbPool('bm_web_servers').insert(await createServer(player.id, setup.dbConfig.database))

    const result = await decideBoot({ env: baseEnv() })

    expect(result.mode).toBe('invalid-config')
    expect(result.issues.map((i) => i.key)).toContain('CONTACT_EMAIL')
  }, 30000)

  test('boots in setup-mode with SETUP_NO_KEYS when keys are missing', async () => {
    const env = baseEnv()
    delete env.ENCRYPTION_KEY
    delete env.SESSION_KEY

    const result = await decideBoot({ env })

    expect(result.mode).toBe('setup')
    expect(result.setupState).toBe(SETUP_STATES.SETUP_NO_KEYS)
  })

  test('boots in setup-mode with SETUP_DB_UNREACHABLE when the DB cannot be reached', async () => {
    const env = baseEnv()
    env.DB_HOST = '127.0.0.1'
    env.DB_PORT = '1' // unroutable
    env.DB_USER = 'nobody'
    env.DB_NAME = 'never_exists'

    const result = await decideBoot({
      env,
      createPool: (cfg) => require('../connections').setupPool(cfg, undefined, { min: 0, max: 1, acquireTimeoutMillis: 1500 })
    })

    expect(result.mode).toBe('setup')
    expect(result.setupState).toBe(SETUP_STATES.SETUP_DB_UNREACHABLE)
    expect(result.dbError).toBeDefined()
  }, 15000)
})
