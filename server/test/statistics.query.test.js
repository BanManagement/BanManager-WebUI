const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createPlayer, createBan, createMute, createAppeal } = require('./fixtures')
const { createSetup } = require('./lib')

describe('Query statistics', () => {
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
    const { config: server, pool } = setup.serversPool.values().next().value

    const player = createPlayer()
    const actor = createPlayer()
    const ban = createBan(player, actor)
    const mute = createMute(player, actor)
    const appeal = createAppeal(ban, 'PlayerBan', server, actor, player)

    await pool('bm_players').insert([player, actor])

    const [inserted] = await pool('bm_player_bans').insert(ban, ['id'])

    await pool('bm_player_mutes').insert(mute)
    await pool('bm_web_appeals').insert({ ...appeal, punishment_id: inserted })

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query statistics {
          statistics {
            totalActiveBans
            totalActiveMutes
            totalPlayers
            totalAppeals
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.statistics.totalActiveBans, 1)
    assert.strictEqual(body.data.statistics.totalActiveMutes, 1)
    assert.strictEqual(body.data.statistics.totalPlayers, 6)
    assert.strictEqual(body.data.statistics.totalAppeals, 1)
  })
})
