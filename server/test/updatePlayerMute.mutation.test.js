const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer, createMute } = require('./fixtures')

describe('Mutation update player mute', () => {
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
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation updatePlayerMute {
        updatePlayerMute(id: "1", serverId: "1", input: {
          reason: "test", expires: 1000000000, soft: false
        }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should error if server does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation updatePlayerMute {
        updatePlayerMute(id: "1", serverId: "a", input: {
          reason: "test", expires: 1000000000, soft: false
        }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Server does not exist')
  })

  test('should error if data does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server } = setup.serversPool.values().next().value
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation updatePlayerMute {
        updatePlayerMute(id: "999999999", serverId: "${server.id}", input: {
          reason: "test", expires: 1000000000, soft: false
        }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Player mute 999999999 does not exist')
  })

  test('should resolve all fields', async () => {
    const { config: server, pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const player = createPlayer()
    const actor = createPlayer()
    const mute = createMute(player, actor)

    await pool('bm_players').insert([player, actor])
    const [inserted] = await pool('bm_player_mutes').insert(mute, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation updatePlayerMute {
        updatePlayerMute(id: "${inserted}", serverId: "${server.id}", input: {
          reason: "testing updates",
          expires: 1000000000,
          soft: false
        }) {
          id
          reason
          created
          updated
          expires
          soft
          player {
            id
            name
          }
          actor {
            id
            name
          }
          acl {
            delete
            update
            yours
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.updatePlayerMute.id, '1')
    assert.strictEqual(body.data.updatePlayerMute.reason, 'testing updates')
    assert.strictEqual(body.data.updatePlayerMute.expires, 1000000000)
    assert.strictEqual(body.data.updatePlayerMute.soft, false)
    assert.deepStrictEqual(body.data.updatePlayerMute.acl, { delete: true, update: true, yours: false })
  })
})
