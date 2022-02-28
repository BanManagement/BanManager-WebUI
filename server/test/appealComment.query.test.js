const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount } = require('./lib')
const { createPlayer, createAppeal, createBan } = require('./fixtures')

describe('Query appealComment', () => {
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

  test('should require player.appeals.view.comments permission', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query appealComment {
          appealComment(id:"1") {
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
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value

    const actor = createPlayer()
    const punishment = createBan(account, actor)

    await pool('bm_players').insert([actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const [commentId] = await pool('bm_web_appeal_comments').insert({
      appeal_id: inserted,
      actor_id: actor.id,
      content: 'asdasdasd',
      type: 0,
      created: punishment.created,
      updated: punishment.updated
    }, ['id'])
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query appealComment {
          appealComment(id:"${commentId}") {
            id
            content
            type
            created
            updated
            actor {
              id
              name
            }
            acl {
              delete
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.appealComment,
      {
        id: commentId.toString(),
        content: 'asdasdasd',
        type: 'comment',
        created: punishment.created,
        updated: punishment.updated,
        actor: { id: unparse(actor.id), name: actor.name },
        acl: { delete: true }
      })
  })
})
