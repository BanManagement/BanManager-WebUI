const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer } = require('./fixtures')

describe('Mutation setRoles', () => {
  let setup
  let request

  beforeAll(async () => {
    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 20000)

  afterAll(async () => {
    await setup.teardown()
  })

  test('should error if unauthenticated', async () => {
    const { pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation setRoles {
        setRoles(player:"${unparse(player.id)}", input: { roles: [], serverRoles: [] }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should require servers.manage permission', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const { pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setRoles {
        setRoles(player:"${unparse(player.id)}", input: { roles: [], serverRoles: [] }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should error if role does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignRole {
        setRoles(player:"${unparse(player.id)}", input: { roles: [ { id: 123123 } ], serverRoles: [] }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Invalid role provided')
  })

  test('should error if server role does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config, pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignRole {
        setRoles(player:"${unparse(player.id)}", input: { roles: [], serverRoles: [ { role: { id: 123123 }, server: { id: "${config.id}" } } ] }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Invalid role provided')
  })

  test('should error if server does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignRole {
        setRoles(player:"${unparse(player.id)}", input: { roles: [], serverRoles: [ { role: { id: 1 }, server: { id: "123" } } ] }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Server 123 does not exist')
  })

  test('should set a players role', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config, pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignRole {
        setRoles(player:"${unparse(player.id)}", input: { roles: [ { id: 3 } ], serverRoles: [ { role: { id: 2 }, server: { id: "${config.id}" } } ] }) {
          roles {
            role {
              id
            }
          }
          serverRoles {
            serverRole {
              id
            }
            server {
              id
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.deepStrictEqual(body.data.setRoles.roles, [{ role: { id: '3' } }])
    assert.deepStrictEqual(body.data.setRoles.serverRoles, [{ serverRole: { id: '2' }, server: { id: config.id } }])
  })
})
