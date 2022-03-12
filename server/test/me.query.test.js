const assert = require('assert')
const supertest = require('supertest')
const { unparse } = require('uuid-parse')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAuthPin } = require('./lib')
const { createPlayer } = require('./fixtures')

describe('Query me', () => {
  let setup
  let request

  beforeAll(async () => {
    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 20000)

  afterAll(async () => {
    await setup.teardown()
  }, 20000)

  test('should resolve all fields', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query me {
        me {
          id
          name
          hasAccount
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert(body.data.me.id)
    assert(body.data.me.name)
    assert(body.data.me.hasAccount)
  })

  test('should error if not logged in', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query me {
        me {
          id
          name
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.me.id, null)
  })

  test('players with custom role and no email should not be marked as having an account', async () => {
    const server = setup.serversPool.values().next().value
    const player = createPlayer()

    await server.pool('bm_players').insert(player)

    const adminCookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body: setRolesBody, statusCode: setRolesStatusCode } = await request
      .post('/graphql')
      .set('Cookie', adminCookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignRole {
        setRoles(player:"${unparse(player.id)}", input: { roles: [ { id: 3 } ], serverRoles: [] }) {
          roles {
            role {
              id
            }
          }
        }
      }`
      })

    assert.strictEqual(setRolesStatusCode, 200)

    assert(setRolesBody)
    assert(setRolesBody.data)

    assert.deepStrictEqual(setRolesBody.data.setRoles.roles, [{ role: { id: '3' } }])

    const cookie = await getAuthPin(request, server, player)
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query me {
        me {
          id
          name
          hasAccount
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert(body.data.me.id)
    assert(body.data.me.name)
    assert.strictEqual(body.data.me.hasAccount, false)
  })
})
