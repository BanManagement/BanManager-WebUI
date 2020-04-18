const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup } = require('./lib')
const { createPlayer, createBan } = require('./fixtures')

describe('Query listPlayerBans', () => {
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
    const data = createBan(player, actor)

    await pool('bm_players').insert([player, actor])
    await pool('bm_player_bans').insert(data)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query {
        listPlayerBans(serverId: "${server.id}") {
          total
          records {
            id
            reason
            created
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
              update
              delete
              yours
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.listPlayerBans, {
      total: 1,
      records: [{
        id: '1',
        reason: data.reason,
        created: data.created,
        expires: 0,
        actor: { id: unparse(actor.id), name: actor.name },
        player: { id: unparse(player.id), name: player.name },
        acl: { delete: false, update: false, yours: false }
      }]
    })
  })
})
