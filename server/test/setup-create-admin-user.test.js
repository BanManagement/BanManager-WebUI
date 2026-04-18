const { createFreshSetup } = require('./lib')
const { createAdminUser } = require('../setup/admin')

const ADMIN_ROLE_ID = 3
const VALID_UUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const VALID_UUID_2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

describe('setup/admin.createAdminUser', () => {
  let setup

  beforeAll(async () => {
    setup = await createFreshSetup({ namespace: 'bm_setup_admin_test' })
  }, 60000)

  afterAll(async () => {
    if (setup) await setup.teardown()
  }, 20000)

  beforeEach(async () => {
    await setup.dbPool('bm_web_player_roles').delete()
    await setup.dbPool('bm_web_users').delete()
  })

  test('inserts a user row + admin role against the real schema', async () => {
    const result = await createAdminUser({
      email: 'first.admin@example.com',
      password: 'longenough',
      playerUuid: VALID_UUID,
      dbPool: setup.dbPool
    })

    expect(result.email).toBe('first.admin@example.com')
    expect(Buffer.isBuffer(result.playerId)).toBe(true)
    expect(result.playerId).toHaveLength(16)

    const userRow = await setup.dbPool('bm_web_users').where('email', 'first.admin@example.com').first()
    expect(userRow).toBeTruthy()
    expect(userRow.player_id).toEqual(result.playerId)
    expect(typeof userRow.password).toBe('string')
    expect(userRow.password).not.toBe('longenough')

    const roleRow = await setup.dbPool('bm_web_player_roles')
      .where('player_id', result.playerId)
      .andWhere('role_id', ADMIN_ROLE_ID)
      .first()
    expect(roleRow).toBeTruthy()
  })

  test('rejects with CREATE_ADMIN_EMAIL_TAKEN if the email already exists', async () => {
    await createAdminUser({
      email: 'taken@example.com',
      password: 'longenough',
      playerUuid: VALID_UUID,
      dbPool: setup.dbPool
    })

    await expect(createAdminUser({
      email: 'taken@example.com',
      password: 'longenough',
      playerUuid: VALID_UUID_2,
      dbPool: setup.dbPool
    })).rejects.toMatchObject({ code: 'CREATE_ADMIN_EMAIL_TAKEN' })

    const count = await setup.dbPool('bm_web_users').count('* as n').first()
    expect(Number(count.n)).toBe(1)
  })

  test('rejects with CREATE_ADMIN_PLAYER_TAKEN if the player UUID already exists', async () => {
    await createAdminUser({
      email: 'first@example.com',
      password: 'longenough',
      playerUuid: VALID_UUID,
      dbPool: setup.dbPool
    })

    await expect(createAdminUser({
      email: 'second@example.com',
      password: 'longenough',
      playerUuid: VALID_UUID,
      dbPool: setup.dbPool
    })).rejects.toMatchObject({ code: 'CREATE_ADMIN_PLAYER_TAKEN' })

    const count = await setup.dbPool('bm_web_users').count('* as n').first()
    expect(Number(count.n)).toBe(1)
  })

  test('rolls back the user insert if the role insert fails (single transaction)', async () => {
    // Pre-seed a conflicting role row so the inner role insert fails on PK collision
    const { parse } = require('uuid-parse')
    const playerId = parse(VALID_UUID, Buffer.alloc(16))

    await setup.dbPool('bm_web_player_roles').insert({
      player_id: playerId,
      role_id: ADMIN_ROLE_ID
    })

    await expect(createAdminUser({
      email: 'rollback@example.com',
      password: 'longenough',
      playerUuid: VALID_UUID,
      dbPool: setup.dbPool
    })).rejects.toThrow()

    const userRow = await setup.dbPool('bm_web_users').where('email', 'rollback@example.com').first()
    expect(userRow).toBeFalsy()
  })
})
