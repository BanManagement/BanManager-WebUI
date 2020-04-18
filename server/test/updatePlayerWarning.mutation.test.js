const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer, createWarning } = require('./fixtures')

describe('Mutation update player warning', () => {
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
        query: `mutation updatePlayerWarning {
        updatePlayerWarning(id: "1", serverId: "1", input: {
          reason: "test", expires: 1000000000, points: 1
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
        query: `mutation updatePlayerWarning {
        updatePlayerWarning(id: "1", serverId: "a", input: {
          reason: "test", expires: 1000000000, points: 1
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
        query: `mutation updatePlayerWarning {
        updatePlayerWarning(id: "999999999", serverId: "${server.id}", input: {
          reason: "test", expires: 1000000000, points: 1
        }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Player warning 999999999 does not exist')
  })

  test('should resolve all fields', async () => {
    const { config: server, pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const player = createPlayer()
    const actor = createPlayer()
    const warning = createWarning(player, actor)

    await pool('bm_players').insert([player, actor])
    const [inserted] = await pool('bm_player_warnings').insert(warning, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation updatePlayerWarning {
        updatePlayerWarning(id: "${inserted}", serverId: "${server.id}", input: {
          reason: "testing updates",
          expires: 1000000000,
          points: 1
        }) {
          id
          reason
          created
          expires
          points
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

    assert.strictEqual(body.data.updatePlayerWarning.id, '' + inserted)
    assert.strictEqual(body.data.updatePlayerWarning.reason, 'testing updates')
    assert.strictEqual(body.data.updatePlayerWarning.expires, 1000000000)
    assert.strictEqual(body.data.updatePlayerWarning.points, 1)
    assert.deepStrictEqual(body.data.updatePlayerWarning.acl, { delete: true, update: true, yours: false })
  })
})
