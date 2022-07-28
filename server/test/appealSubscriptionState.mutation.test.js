const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createAppeal, createBan } = require('./fixtures')

describe('Mutation appealSubscriptionState', () => {
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
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealSubscriptionState {
        appealSubscriptionState(subscriptionState: SUBSCRIBED, id: 1) {
          state
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should allow view.any to subscribe', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealSubscriptionState {
        appealSubscriptionState(subscriptionState: SUBSCRIBED, id: ${inserted}) {
          state
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.appealSubscriptionState.state, 'SUBSCRIBED')
  })

  test('should allow view.any to unsubscribe', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealSubscriptionState {
        appealSubscriptionState(subscriptionState: IGNORED, id: ${inserted}) {
          state
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.appealSubscriptionState.state, 'IGNORED')
  })

  test('should allow view.own to subscribe', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'view.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealSubscriptionState {
        appealSubscriptionState(subscriptionState: SUBSCRIBED, id: ${inserted}) {
          state
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.appealSubscriptionState.state, 'SUBSCRIBED')
  })

  test('should allow view.own to unsubscribe', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'view.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealSubscriptionState {
        appealSubscriptionState(subscriptionState: IGNORED, id: ${inserted}) {
          state
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.appealSubscriptionState.state, 'IGNORED')
  })

  test('should allow view.assigned to subscribe', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'view.assigned')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealSubscriptionState {
        appealSubscriptionState(subscriptionState: SUBSCRIBED, id: ${inserted}) {
          state
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.appealSubscriptionState.state, 'SUBSCRIBED')
  })

  test('should allow view.assigned to unsubscribe', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'view.assigned')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealSubscriptionState {
        appealSubscriptionState(subscriptionState: IGNORED, id: ${inserted}) {
          state
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.appealSubscriptionState.state, 'IGNORED')
  })

  test('should error if appeal does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealSubscriptionState {
        appealSubscriptionState(subscriptionState: SUBSCRIBED, id: 123123) {
          state
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Appeal 123123 does not exist')
  })
})
