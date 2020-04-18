const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer } = require('./fixtures')

describe('Mutation assignServerRole', () => {
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

  test('should error if unauthenticated', async () => {
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignServerRole {
        assignServerRole(players:["${unparse(player.id)}"], serverId: "${server.id}", role: 3) {
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
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignServerRole {
        assignServerRole(players:["${unparse(player.id)}"], serverId: "${server.id}", role: 123123) {
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
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignServerRole {
        assignServerRole(players:["${unparse(player.id)}"], serverId: "${server.id}", role: 123123) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Role 123123 does not exist')
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
        query: `mutation assignServerRole {
        assignServerRole(players:["${unparse(player.id)}"], serverId: "3", role: 3) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Server 3 does not exist')
  })

  test('should assign player role', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignServerRole {
        assignServerRole(players:["${unparse(player.id)}"], serverId: "${server.id}", role: 3) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.assignServerRole.id, '3')
  })

  test(
    'should not error when assigning a player to a role they are already assigned to',
    async () => {
      const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
      const { config: server, pool } = setup.serversPool.values().next().value
      const player = createPlayer()

      await pool('bm_players').insert(player)

      const { body, statusCode } = await request
        .post('/graphql')
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .send({
          query: `mutation assignServerRole {
          assignServerRole(players:["${unparse(player.id)}"], serverId: "${server.id}", role: 3) {
            id
          }
        }`
        })

      assert.strictEqual(statusCode, 200)

      assert(body)
      assert(body.data)

      assert.strictEqual(body.data.assignServerRole.id, '3')

      const { body: body2, statusCode: statusCode2 } = await request
        .post('/graphql')
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .send({
          query: `mutation assignServerRole {
          assignServerRole(players:["${unparse(player.id)}"], serverId: "${server.id}", role: 3) {
            id
          }
        }`
        })

      assert.strictEqual(statusCode2, 200)

      assert(body2)
      assert(body2.data)

      assert.strictEqual(body2.data.assignServerRole.id, '3')
    }
  )
})
