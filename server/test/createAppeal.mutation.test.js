const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer, createBan } = require('./fixtures')

describe('Mutation create appeal', () => {
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
        query: `mutation createAppeal {
        createAppeal(input: {
          serverId: "asd", reason: "test", punishmentId: "1", type: PlayerBan
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
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppeal {
        createAppeal(input: {
          serverId: "${server.id}", reason: "test", punishmentId: "${id}", type: PlayerBan
        }) {
          id
          reason
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.createAppeal.id, '1')
    assert.strictEqual(body.data.createAppeal.reason, 'test')
  })

  test('should error if player already banned', async () => {
    const { config: server } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppeal {
        createAppeal(input: {
          serverId: "${server.id}", reason: "test", punishmentId: "1", type: PlayerBan
        }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.errors)

    assert.strictEqual(body.errors[0].message, 'An appeal already exists for this punishment')
  })
})
