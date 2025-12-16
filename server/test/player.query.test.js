const assert = require('assert')
const { parse, unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup } = require('./lib')
const { createPlayer } = require('./fixtures')

describe('Query player', () => {
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
    const { pool } = setup.serversPool.values().next().value

    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query players {
        player(player:"${unparse(player.id)}") {
          id
          name
          lastSeen
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.player.id, unparse(player.id))
    assert.strictEqual(body.data.player.name, player.name)
    assert.strictEqual(body.data.player.lastSeen, player.lastSeen)
  })

  test('should resolve Bedrock/Floodgate UUID format', async () => {
    const { pool } = setup.serversPool.values().next().value

    const bedrockUUID = '00000000-0000-0000-0009-01f4bf5b7415'
    const player = createPlayer({
      id: parse(bedrockUUID, Buffer.alloc(16))
    })

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query players {
        player(player:"${bedrockUUID}") {
          id
          name
          lastSeen
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.player.id, bedrockUUID)
    assert.strictEqual(body.data.player.name, player.name)
    assert.strictEqual(body.data.player.lastSeen, player.lastSeen)
  })
})
