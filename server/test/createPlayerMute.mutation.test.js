const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer, createMute } = require('./fixtures')

describe('Mutation create player mute', () => {
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
        query: `mutation createPlayerMute {
        createPlayerMute(input: {
          player: "${unparse(player.id)}", reason: "test", expires: 1000000000, server: "asd", soft: false
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
    const mute = createMute(player, actor)

    await pool('bm_players').insert([player, actor])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createPlayerMute {
        createPlayerMute(input: {
          player: "${unparse(player.id)}",
          reason: "${mute.reason}",
          expires: 1000000000,
          server: "${server.id}",
          soft: false
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

    assert.strictEqual(body.data.createPlayerMute.id, '1')
    assert.strictEqual(body.data.createPlayerMute.reason, mute.reason)
    assert.strictEqual(body.data.createPlayerMute.expires, 1000000000)
    assert.deepStrictEqual(body.data.createPlayerMute.acl, { delete: true, update: true, yours: false })
  })

  test('should error if player already muted', async () => {
    const { config: server, pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const player = createPlayer()
    const actor = createPlayer()
    const mute = createMute(player, actor)

    await pool('bm_players').insert([player, actor])
    await pool('bm_player_mutes').insert(mute)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createPlayerMute {
        createPlayerMute(input: {
          player: "${unparse(player.id)}",
          reason: "${mute.reason}",
          expires: 1000000000,
          server: "${server.id}",
          soft: false
        }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.errors)

    assert.strictEqual(body.errors[0].message, 'Player already muted on selected server, please unmute first')
  })
})
