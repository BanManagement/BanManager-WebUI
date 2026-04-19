const assert = require('assert')
const { parse } = require('uuid-parse')
const { hash } = require('../data/hash')
const { setupPool } = require('../connections')
const {
  hasKeys,
  hasDbVars,
  isSetupComplete,
  getSetupState,
  isSetupModeState,
  SETUP_STATES
} = require('../setup/state')
const { validateAdminInput, ADMIN_ROLE_ID } = require('../setup/admin')
const { createFreshSetup } = require('./lib')
const { createPlayer, createServer } = require('./fixtures')

const validKey = 'a'.repeat(64)
const validUuid = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

describe('setup/state (pure helpers)', () => {
  test('hasKeys requires both ENCRYPTION_KEY and SESSION_KEY to be valid', () => {
    assert.strictEqual(hasKeys({ ENCRYPTION_KEY: validKey, SESSION_KEY: validKey }), true)
    assert.strictEqual(hasKeys({ ENCRYPTION_KEY: validKey }), false)
    assert.strictEqual(hasKeys({ ENCRYPTION_KEY: 'short', SESSION_KEY: validKey }), false)
    assert.strictEqual(hasKeys({}), false)
  })

  test('hasDbVars requires DB_HOST, DB_NAME and DB_USER', () => {
    assert.strictEqual(hasDbVars({ DB_HOST: 'h', DB_NAME: 'n', DB_USER: 'u' }), true)
    assert.strictEqual(hasDbVars({ DB_HOST: 'h', DB_NAME: 'n' }), false)
    assert.strictEqual(hasDbVars({ DB_HOST: 'h' }), false)
    assert.strictEqual(hasDbVars({}), false)
  })

  test('isSetupModeState identifies non-NORMAL states as setup-mode', () => {
    assert.strictEqual(isSetupModeState(SETUP_STATES.NORMAL), false)
    assert.strictEqual(isSetupModeState(SETUP_STATES.SETUP_NO_KEYS), true)
    assert.strictEqual(isSetupModeState(SETUP_STATES.SETUP_NO_DB), true)
    assert.strictEqual(isSetupModeState(SETUP_STATES.SETUP_DB_UNREACHABLE), true)
    assert.strictEqual(isSetupModeState(SETUP_STATES.SETUP_NO_ADMIN), true)
  })

  test('isSetupComplete returns false for a null pool', async () => {
    assert.strictEqual(await isSetupComplete(null), false)
  })
})

describe('setup/state (real DB)', () => {
  let setup

  beforeAll(async () => {
    setup = await createFreshSetup({ namespace: 'bm_setup_state_test' })
  }, 60000)

  afterAll(async () => {
    if (setup) await setup.teardown()
  }, 20000)

  beforeEach(async () => {
    await setup.dbPool('bm_web_player_roles').delete()
    await setup.dbPool('bm_web_users').delete()
    await setup.dbPool('bm_web_servers').delete()
  })

  test('isSetupComplete returns false on a fresh DB with no admin or server rows', async () => {
    assert.strictEqual(await isSetupComplete(setup.dbPool), false)
  })

  test('isSetupComplete returns false when an admin role exists but no server is registered', async () => {
    const player = createPlayer()
    await setup.dbPool('bm_players').insert(player)
    await setup.dbPool('bm_web_users').insert({
      email: 'admin@example.com',
      password: await hash('longenough'),
      player_id: player.id,
      updated: Math.floor(Date.now() / 1000)
    })
    await setup.dbPool('bm_web_player_roles').insert({ player_id: player.id, role_id: ADMIN_ROLE_ID })

    assert.strictEqual(await isSetupComplete(setup.dbPool), false)
  })

  test('isSetupComplete returns true when an admin AND a server row exist', async () => {
    const player = createPlayer()
    await setup.dbPool('bm_players').insert(player)
    await setup.dbPool('bm_web_users').insert({
      email: 'admin2@example.com',
      password: await hash('longenough'),
      player_id: player.id,
      updated: Math.floor(Date.now() / 1000)
    })
    await setup.dbPool('bm_web_player_roles').insert({ player_id: player.id, role_id: ADMIN_ROLE_ID })
    await setup.dbPool('bm_web_servers').insert(await createServer(player.id, setup.dbConfig.database))

    assert.strictEqual(await isSetupComplete(setup.dbPool), true)
  })

  describe('getSetupState', () => {
    const validEnv = {
      ENCRYPTION_KEY: validKey,
      SESSION_KEY: validKey,
      DB_HOST: 'h',
      DB_NAME: 'n',
      DB_USER: 'u'
    }

    test('SETUP_NO_KEYS when keys are missing', async () => {
      assert.strictEqual(await getSetupState({}, null), SETUP_STATES.SETUP_NO_KEYS)
    })

    test('SETUP_NO_DB when keys present but no DB vars', async () => {
      assert.strictEqual(
        await getSetupState({ ENCRYPTION_KEY: validKey, SESSION_KEY: validKey }, null),
        SETUP_STATES.SETUP_NO_DB
      )
    })

    test('SETUP_DB_UNREACHABLE when no pool is provided', async () => {
      assert.strictEqual(await getSetupState(validEnv, null), SETUP_STATES.SETUP_DB_UNREACHABLE)
    })

    test('SETUP_DB_UNREACHABLE when the pool cannot reach the database', async () => {
      // Bind to an unroutable port so the connection attempt fails fast.
      const failingPool = setupPool({
        host: '127.0.0.1',
        port: 1,
        user: 'nobody',
        password: '',
        database: 'never_exists'
      }, undefined, { min: 0, max: 1, acquireTimeoutMillis: 1500 })

      try {
        assert.strictEqual(
          await getSetupState(validEnv, failingPool),
          SETUP_STATES.SETUP_DB_UNREACHABLE
        )
      } finally {
        await failingPool.destroy().catch(() => {})
      }
    }, 15000)

    test('SETUP_NO_ADMIN when DB is reachable but no admin row exists', async () => {
      assert.strictEqual(
        await getSetupState(validEnv, setup.dbPool),
        SETUP_STATES.SETUP_NO_ADMIN
      )
    })

    test('NORMAL when DB reachable, admin and server rows are present', async () => {
      const player = createPlayer()
      await setup.dbPool('bm_players').insert(player)
      await setup.dbPool('bm_web_users').insert({
        email: 'normal@example.com',
        password: await hash('longenough'),
        player_id: player.id,
        updated: Math.floor(Date.now() / 1000)
      })
      await setup.dbPool('bm_web_player_roles').insert({ player_id: player.id, role_id: ADMIN_ROLE_ID })
      await setup.dbPool('bm_web_servers').insert(await createServer(player.id, setup.dbConfig.database))

      assert.strictEqual(await getSetupState(validEnv, setup.dbPool), SETUP_STATES.NORMAL)
    })
  })
})

describe('setup/admin.validateAdminInput', () => {
  const validEmail = 'admin@example.com'

  test('returns no errors for valid input', () => {
    const errors = validateAdminInput({
      email: validEmail,
      password: 'longenough',
      playerUuid: validUuid
    })

    assert.deepStrictEqual(errors, [])
  })

  test('flags invalid email', () => {
    const errors = validateAdminInput({
      email: 'not-an-email',
      password: 'longenough',
      playerUuid: validUuid
    })

    assert.deepStrictEqual(errors.map(e => e.field), ['email'])
  })

  test('flags too-short password', () => {
    const errors = validateAdminInput({
      email: validEmail,
      password: '123',
      playerUuid: validUuid
    })

    assert.deepStrictEqual(errors.map(e => e.field), ['password'])
  })

  test('flags invalid UUID', () => {
    const errors = validateAdminInput({
      email: validEmail,
      password: 'longenough',
      playerUuid: 'not-a-uuid'
    })

    assert.deepStrictEqual(errors.map(e => e.field), ['playerUuid'])
  })

  test('returns multiple errors at once', () => {
    const errors = validateAdminInput({})

    assert.deepStrictEqual(errors.map(e => e.field).sort(), ['email', 'password', 'playerUuid'])
  })

  test('parse exists for use elsewhere (sanity)', () => {
    // Sanity check that we can convert UUIDs to buffers — used by createAdminUser.
    const buf = parse(validUuid, Buffer.alloc(16))
    assert.strictEqual(buf.length, 16)
  })
})
