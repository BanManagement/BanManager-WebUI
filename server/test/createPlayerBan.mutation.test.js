const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer, createBan } = require('./fixtures')

describe('Mutation create player ban', () => {
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
        query: `mutation createPlayerBan {
        createPlayerBan(input: {
          player: "${unparse(player.id)}", reason: "test", expires: 1000000000, server: "asd"
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
    const ban = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createPlayerBan {
        createPlayerBan(input: {
          player: "${unparse(player.id)}", reason: "${ban.reason}", expires: 1000000000, server: "${server.id}"
        }) {
          id
          reason
          created
          updated
          expires
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

    assert.strictEqual(body.data.createPlayerBan.id, '1')
    assert.strictEqual(body.data.createPlayerBan.reason, ban.reason)
    assert.strictEqual(body.data.createPlayerBan.expires, 1000000000)
    assert.deepStrictEqual(body.data.createPlayerBan.acl, { delete: true, update: true, yours: false })
  })

  test('should error if player already banned', async () => {
    const { config: server, pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const player = createPlayer()
    const actor = createPlayer()
    const ban = createBan(player, actor)

    await pool('bm_players').insert([player, actor])
    await pool('bm_player_bans').insert(ban)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createPlayerBan {
        createPlayerBan(input: {
          player: "${unparse(player.id)}", reason: "${ban.reason}", expires: 1000000000, server: "${server.id}"
        }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.errors)

    assert.strictEqual(body.errors[0].message, 'Player already banned on selected server, please unban first')
  })
})
