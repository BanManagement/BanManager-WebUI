const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup } = require('./lib')
const { createPlayer } = require('./fixtures')

describe('Query searchPlayers', () => {
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
        searchPlayers(name:"${player.name.substr(0, player.name.length - 2)}") {
          id
          name
          lastSeen
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.searchPlayers.length, 1)
    assert.strictEqual(body.data.searchPlayers[0].id, unparse(player.id))
    assert.strictEqual(body.data.searchPlayers[0].name, player.name)
    assert.strictEqual(body.data.searchPlayers[0].lastSeen, player.lastSeen)
  })
})
