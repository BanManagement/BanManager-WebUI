const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer, createWarning } = require('./fixtures')

describe('Mutation create player warning', () => {
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
    const player = createPlayer()
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation createPlayerWarning {
        createPlayerWarning(input: {
          player: "${unparse(player.id)}", reason: "test", server: "asd", points: 1, expires: 1000000000
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

  test('should resolve all fields', async () => {
    const { config: server, pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const player = createPlayer()
    const actor = createPlayer()
    const warning = createWarning(player, actor)

    await pool('bm_players').insert([player, actor])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createPlayerWarning {
        createPlayerWarning(input: {
          player: "${unparse(player.id)}",
          reason: "${warning.reason}",
          server: "${server.id}",
          points: 1,
          expires: 1000000000
        }) {
          id
          reason
          expires
          created
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

    assert.strictEqual(body.data.createPlayerWarning.id, '1')
    assert.strictEqual(body.data.createPlayerWarning.reason, warning.reason)
    assert.strictEqual(body.data.createPlayerWarning.expires, 1000000000)
    assert.deepStrictEqual(body.data.createPlayerWarning.acl, { delete: true, update: true, yours: false })
  })
})
