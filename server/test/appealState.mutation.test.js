const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createAppeal, createBan } = require('./fixtures')
const { getUnreadNotificationsCount } = require('../data/notification')
const { getAppealWatchers, subscribeAppeal } = require('../data/notification/appeal')

describe('Mutation appealState', () => {
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
        query: `mutation appealState {
        appealState(state: 1, id: 1) {
          appeal {
            id
            state {
              id
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should allow update.state.any', async () => {
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
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'update.state.any', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealState {
        appealState(state: 2, id: ${inserted}) {
          appeal {
            id
            state {
              id
            }
          }
          comment {
            type
            state {
              id
            }
          }
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.appealState.appeal.state.id, '2')
    assert.strictEqual(body.data.appealState.comment.type, 'state')
    assert.strictEqual(body.data.appealState.comment.state.id, '2')
  })

  test('should allow update.state.own', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const actor = createPlayer()
    const punishment = createBan(account, actor)

    await pool('bm_players').insert([actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'update.state.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealState {
        appealState(state: 2, id: ${inserted}) {
          appeal {
            id
            state {
              id
            }
          }
          comment {
            type
            state {
              id
            }
          }
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.appealState.appeal.state.id, '2')
    assert.strictEqual(body.data.appealState.comment.type, 'state')
    assert.strictEqual(body.data.appealState.comment.state.id, '2')
  })

  test('should allow update.state.assigned', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, actor, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'update.state.assigned')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealState {
        appealState(state: 2, id: ${inserted}) {
          appeal {
            id
            state {
              id
            }
          }
          comment {
            type
            state {
              id
            }
          }
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.appealState.appeal.state.id, '2')
    assert.strictEqual(body.data.appealState.comment.type, 'state')
    assert.strictEqual(body.data.appealState.comment.state.id, '2')
  })

  test('should subscribe player and notify of state change', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    await subscribeAppeal(setup.dbPool, inserted, player.id)

    const role = await setTempRole(setup.dbPool, player, 'player.appeals', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealState {
        appealState(state: 2, id: ${inserted}) {
          appeal {
            id
            state {
              id
            }
          }
          comment {
            type
            state {
              id
            }
          }
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.appealState.appeal.state.id, '2')
    assert.strictEqual(body.data.appealState.comment.type, 'state')
    assert.strictEqual(body.data.appealState.comment.state.id, '2')

    const watchers = await getAppealWatchers(setup.dbPool, inserted)
    const notificationCount = await getUnreadNotificationsCount(setup.dbPool, player.id)

    assert.strictEqual(watchers.filter(playerId => playerId.equals(player.id)).length, 1)
    assert.strictEqual(notificationCount, 1)
  })

  test('should error if report does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealState {
        appealState(state: 2, id: 123123) {
          appeal {
            id
            state {
              id
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Appeal 123123 does not exist')
  })

  test('should error if state does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation appealState {
        appealState(state: 2123, id: 3) {
          appeal {
            id
            state {
              id
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Appeal State 2123 does not exist')
  })
})
