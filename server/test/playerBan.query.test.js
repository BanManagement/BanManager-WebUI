const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup } = require('./lib')
const { createPlayer, createBan } = require('./fixtures')

describe('Query player ban', () => {
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

    await pool('bm_players').insert([player, actor])
    await pool('bm_player_bans').insert(ban)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query playerBan {
        playerBan(id:"1", serverId: "${server.id}") {
          id
          reason
          created
          expires
          actor {
            id
            name
          }
          acl {
            update
            delete
            yours
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.playerBan,
      {
        id: '1',
        reason: ban.reason,
        created: ban.created,
        expires: 0,
        actor: { id: unparse(actor.id), name: actor.name },
        acl: { delete: false, update: false, yours: false }
      })
  })
})
