const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createAppeal, createBan } = require('./fixtures')

describe('Mutation createAppealComment', () => {
  let setup
  let request

  beforeAll(async () => {
    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 20000)

  afterAll(async () => {
    await setup.teardown()
  })

  test('should error if unauthenticated', async () => {
    const { config: server, pool } = setup.serversPool.values().next().value
    const actor = createPlayer()
    const punishment = createBan(actor, actor)

    await pool('bm_players').insert([actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal(id, 'PlayerBan', server, actor)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment {
        createAppealComment(id: ${inserted}, input: { comment: "test" }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should allow comment.any', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal(id, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'comment.any', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment {
        createAppealComment(id: ${inserted} input: { comment: "test" }) {
          comment
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.createAppealComment.comment, 'test')
  })

  test('should allow comment.own', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const actor = createPlayer()
    const punishment = createBan(account, actor)

    await pool('bm_players').insert([actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal(id, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'comment.own', 'view.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment {
        createAppealComment(id: ${inserted} input: { comment: "test" }) {
          comment
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.createAppealComment.comment, 'test')
  })

  test('should allow comment.assigned', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal(id, 'PlayerBan', server, actor, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'comment.assigned', 'view.assigned')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment {
        createAppealComment(id: ${inserted} input: { comment: "test" }) {
          comment
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.createAppealComment.comment, 'test')
  })

  test('should error if appeal does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment {
        createAppealComment(id: 123123 input: { comment: "test" }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Appeal 123123 does not exist')
  })
})
