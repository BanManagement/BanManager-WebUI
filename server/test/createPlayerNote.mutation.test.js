const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer, createNote } = require('./fixtures')

describe('Mutation create player note', () => {
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
        query: `mutation createPlayerNote {
        createPlayerNote(input: {
          player: "${unparse(player.id)}", message: "test", server: "asd"
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

  test('should error if message too long', async () => {
    const { config: server } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    // eslint-disable-next-line max-len
    const message = 'wowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowowo'
    const player = createPlayer()
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createPlayerNote {
        createPlayerNote(input: {
          player: "${unparse(player.id)}", message: "${message}", server: "${server.id}"
        }) {
          id
          message
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

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'message Must be no more than 255 characters in length')
  })

  test('should resolve all fields', async () => {
    const { config: server, pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const player = createPlayer()
    const actor = createPlayer()
    const note = createNote(player, actor)

    await pool('bm_players').insert([player, actor])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createPlayerNote {
        createPlayerNote(input: {
          player: "${unparse(player.id)}", message: "${note.message}", server: "${server.id}"
        }) {
          id
          message
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

    assert.strictEqual(body.data.createPlayerNote.id, '1')
    assert.strictEqual(body.data.createPlayerNote.message, note.message)
    assert.deepStrictEqual(body.data.createPlayerNote.acl, { delete: true, update: true, yours: false })
  })
})
