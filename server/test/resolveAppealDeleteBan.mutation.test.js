const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createBan, createAppeal } = require('./fixtures')
const { getUnreadNotificationsCount } = require('../data/notification')
const { getAppealWatchers, subscribeAppeal } = require('../data/notification/appeal')

describe('Mutation resolveAppealDeleteBan', () => {
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
        query: `mutation resolveAppealDeleteBan {
          resolveAppealDeleteBan(id: "123") {
            appeal {
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
    const punishment = createBan(player, account)

    await pool('bm_players').insert(player)

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, player)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const appealRole = await setTempRole(setup.dbPool, account, 'player.appeals', 'update.state.any', 'view.any')
    const banRole = await setTempRole(setup.dbPool, account, 'player.bans', 'delete.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveAppealDeleteBan {
          resolveAppealDeleteBan(id: ${inserted}) {
            appeal {
              state {
                id
              }
            }
            comment {
              type
              created
              state {
                id
                name
              }
              actor {
                id
                name
              }
            }
          }
        }`
      })

    await appealRole.reset()
    await banRole.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.resolveAppealDeleteBan.appeal.state.id, '3')
    assert.strictEqual(body.data.resolveAppealDeleteBan.comment.type, 'deletepunishment')
    assert.strictEqual(body.data.resolveAppealDeleteBan.comment.state.id, '3')
    assert.strictEqual(body.data.resolveAppealDeleteBan.comment.actor.name, account.name)
  })

  test('should allow update.state.own', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const punishment = createBan(player, account)

    await pool('bm_players').insert(player)

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const appealRole = await setTempRole(setup.dbPool, account, 'player.appeals', 'update.state.own', 'view.any')
    const banRole = await setTempRole(setup.dbPool, account, 'player.bans', 'delete.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveAppealDeleteBan {
          resolveAppealDeleteBan(id: ${inserted}) {
            appeal {
              state {
                id
              }
            }
            comment {
              type
              created
              state {
                id
                name
              }
              actor {
                id
                name
              }
            }
          }
        }`
      })

    await appealRole.reset()
    await banRole.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.resolveAppealDeleteBan.appeal.state.id, '3')
    assert.strictEqual(body.data.resolveAppealDeleteBan.comment.type, 'deletepunishment')
    assert.strictEqual(body.data.resolveAppealDeleteBan.comment.state.id, '3')
    assert.strictEqual(body.data.resolveAppealDeleteBan.comment.actor.name, account.name)
  })

  test('should allow update.state.assigned', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const punishment = createBan(player, account)

    await pool('bm_players').insert(player)

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, player, account)

    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const appealRole = await setTempRole(setup.dbPool, account, 'player.appeals', 'update.state.assigned')
    const banRole = await setTempRole(setup.dbPool, account, 'player.bans', 'delete.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveAppealDeleteBan {
          resolveAppealDeleteBan(id: ${inserted}) {
            appeal {
              state {
                id
              }
            }
            comment {
              type
              created
              state {
                id
                name
              }
              actor {
                id
                name
              }
            }
          }
        }`
      })

    await appealRole.reset()
    await banRole.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.resolveAppealDeleteBan.appeal.state.id, '3')
    assert.strictEqual(body.data.resolveAppealDeleteBan.comment.type, 'deletepunishment')
    assert.strictEqual(body.data.resolveAppealDeleteBan.comment.state.id, '3')
    assert.strictEqual(body.data.resolveAppealDeleteBan.comment.actor.name, account.name)
  })

  test('should subscribe player and notify of state change', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const punishment = createBan(player, account)

    await pool('bm_players').insert(player)

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, player, account)

    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    await subscribeAppeal(setup.dbPool, inserted, player.id)

    const role = await setTempRole(setup.dbPool, player, 'player.appeals', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveAppealDeleteBan {
          resolveAppealDeleteBan(id: ${inserted}) {
            appeal {
              state {
                id
              }
            }
            comment {
              type
              created
              state {
                id
                name
              }
              actor {
                id
                name
              }
            }
          }
        }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.resolveAppealDeleteBan.appeal.state.id, '3')
    assert.strictEqual(body.data.resolveAppealDeleteBan.comment.type, 'deletepunishment')
    assert.strictEqual(body.data.resolveAppealDeleteBan.comment.state.id, '3')
    assert.strictEqual(body.data.resolveAppealDeleteBan.comment.actor.name, account.name)

    const watchers = await getAppealWatchers(setup.dbPool, inserted)
    const notificationCount = await getUnreadNotificationsCount(setup.dbPool, player.id)

    assert.strictEqual(watchers.filter(playerId => playerId.equals(player.id)).length, 1)
    assert.strictEqual(notificationCount, 1)
  })

  test('should error if appeal does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveAppealDeleteBan {
          resolveAppealDeleteBan(id: 123123) {
            appeal {
              state {
                id
              }
            }
            comment {
              type
              created
              state {
                id
                name
              }
              actor {
                id
                name
              }
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Appeal 123123 does not exist')
  })
})
