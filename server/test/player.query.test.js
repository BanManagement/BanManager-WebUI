const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup } = require('./lib')
const {
  createPlayer
  , createBan
  , createKick
  , createMute
  , createNote
  , createWarning
} = require('./fixtures')
const { insert } = require('../data/udify')

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

  test(
    'should resolve all fields',
    async () => { // eslint-disable-line max-statements
      const { config: server, pool } = setup.serversPool.values().next().value

      const player = createPlayer()
      const actor = createPlayer()
      const ban = createBan(player, actor)
      const kick = createKick(player, actor)
      const mute = createMute(player, actor)
      const note = createNote(player, actor)
      const warning = createWarning(player, actor)

      await insert(pool, 'bm_players', [player, actor])
      await insert(pool, 'bm_player_bans', ban)
      await insert(pool, 'bm_player_kicks', kick)
      await insert(pool, 'bm_player_mutes', mute)
      await insert(pool, 'bm_player_notes', note)
      await insert(pool, 'bm_player_warnings', warning)

      const { body, statusCode } = await request
        .post('/graphql')
        .set('Accept', 'application/json')
        .send({
          query: `query player {
          player(id:"${unparse(player.id)}") {
            id
            name
            servers {
              id
              server {
                id
                name
              }
              ip
              bans {
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
              mutes {
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
              warnings {
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
              notes {
                id
                message
                created
                actor {
                  id
                  name
                }
                acl {
                  update
                  delete
                }
              }
              acl {
                bans {
                  create
                }
                mutes {
                  create
                }
                notes {
                  create
                }
                warnings {
                  create
                }
              }
            }
          }
        }`
        })

      assert.strictEqual(statusCode, 200)

      assert(body)
      assert(body.data)

      assert.strictEqual(body.data.player.id, unparse(player.id))
      assert.strictEqual(body.data.player.name, player.name)

      assert.strictEqual(body.data.player.servers.length, 1)

      const actServer = body.data.player.servers[0]

      assert.strictEqual(actServer.id, server.id)
      assert.strictEqual(actServer.server.name, server.name)
      assert.strictEqual(actServer.ip, null)

      assert.strictEqual(actServer.bans.length, 1)
      assert.deepStrictEqual(actServer.bans[0],
        {
          id: '1',
          reason: ban.reason,
          created: ban.created,
          expires: 0,
          actor: { id: unparse(actor.id), name: actor.name },
          acl: { delete: false, update: false, yours: false }
        })

      assert.strictEqual(actServer.mutes.length, 1)
      assert.deepStrictEqual(actServer.mutes[0],
        {
          id: '1',
          reason: mute.reason,
          created: mute.created,
          expires: 0,
          actor: { id: unparse(actor.id), name: actor.name },
          acl: { delete: false, update: false, yours: false }
        })

      assert.strictEqual(actServer.notes, null)

      assert.strictEqual(actServer.warnings.length, 1)
      assert.deepStrictEqual(actServer.warnings[0],
        {
          id: '1',
          reason: warning.reason,
          created: warning.created,
          expires: 0,
          actor: { id: unparse(actor.id), name: actor.name },
          acl: { delete: false, update: false, yours: false }
        })

      assert.strictEqual(actServer.acl.bans.create, false)
      assert.strictEqual(actServer.acl.mutes.create, false)
      assert.strictEqual(actServer.acl.notes.create, false)
      assert.strictEqual(actServer.acl.warnings.create, false)
    }
  )
})
