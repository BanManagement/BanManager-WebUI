const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createMute, createAppeal } = require('./fixtures')
const { getUnreadNotificationsCount } = require('../data/notification')
const { getAppealWatchers, subscribeAppeal } = require('../data/notification/appeal')

describe('Mutation resolveAppealUpdateMute', () => {
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
        query: `mutation resolveAppealUpdateMute {
          resolveAppealUpdateMute(id: "123", input: {
            reason: "test", expires: 1000000000, soft: false
          }) {
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
    const punishment = createMute(player, account)

    await pool('bm_players').insert(player)

    const [id] = await pool('bm_player_mutes').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerMute', server, player)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const appealRole = await setTempRole(setup.dbPool, account, 'player.appeals', 'update.state.any', 'view.any')
    const muteRole = await setTempRole(setup.dbPool, account, 'player.mutes', 'update.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveAppealUpdateMute {
          resolveAppealUpdateMute(id: ${inserted}, input: {
            reason: "test", expires: 1000000000, soft: true
          }) {
            appeal {
              state {
                id
              }
            }
            comment {
              type
              created
              oldReason
              newReason
              oldExpires
              newExpires
              oldSoft
              newSoft
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
    await muteRole.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.resolveAppealUpdateMute.appeal.state.id, '3')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.type, 'editpunishment')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.state.id, '3')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.actor.name, account.name)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.oldReason, punishment.reason)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.newReason, 'test')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.oldExpires, punishment.expires)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.newExpires, 1000000000)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.oldSoft, false)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.newSoft, true)
  })

  test('should allow update.state.own', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const punishment = createMute(player, account)

    await pool('bm_players').insert(player)

    const [id] = await pool('bm_player_mutes').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerMute', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const appealRole = await setTempRole(setup.dbPool, account, 'player.appeals', 'update.state.own', 'view.any')
    const muteRole = await setTempRole(setup.dbPool, account, 'player.mutes', 'update.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveAppealUpdateMute {
          resolveAppealUpdateMute(id: ${inserted}, input: {
            reason: "test", expires: 1000000000, soft: false
          }) {
            appeal {
              state {
                id
              }
            }
            comment {
              type
              created
              oldReason
              newReason
              oldExpires
              newExpires
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
    await muteRole.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.resolveAppealUpdateMute.appeal.state.id, '3')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.type, 'editpunishment')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.state.id, '3')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.actor.name, account.name)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.oldReason, punishment.reason)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.newReason, 'test')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.oldExpires, punishment.expires)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.newExpires, 1000000000)
  })

  test('should allow update.state.assigned', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const punishment = createMute(player, account)

    await pool('bm_players').insert(player)

    const [id] = await pool('bm_player_mutes').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerMute', server, player, account)

    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const appealRole = await setTempRole(setup.dbPool, account, 'player.appeals', 'update.state.assigned')
    const muteRole = await setTempRole(setup.dbPool, account, 'player.mutes', 'update.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveAppealUpdateMute {
          resolveAppealUpdateMute(id: ${inserted}, input: {
            reason: "test", expires: 1000000000, soft: false
          }) {
            appeal {
              state {
                id
              }
            }
            comment {
              type
              created
              oldReason
              newReason
              oldExpires
              newExpires
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
    await muteRole.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.resolveAppealUpdateMute.appeal.state.id, '3')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.type, 'editpunishment')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.state.id, '3')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.actor.name, account.name)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.oldReason, punishment.reason)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.newReason, 'test')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.oldExpires, punishment.expires)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.newExpires, 1000000000)
  })

  test('should subscribe player and notify of state change', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const punishment = createMute(player, account)

    await pool('bm_players').insert(player)

    const [id] = await pool('bm_player_mutes').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerMute', server, player, account)

    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    await subscribeAppeal(setup.dbPool, inserted, player.id)

    const role = await setTempRole(setup.dbPool, player, 'player.appeals', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveAppealUpdateMute {
          resolveAppealUpdateMute(id: ${inserted}, input: {
            reason: "test", expires: 1000000000, soft: false
          }) {
            appeal {
              state {
                id
              }
            }
            comment {
              type
              created
              oldReason
              newReason
              oldExpires
              newExpires
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
    assert.strictEqual(body.data.resolveAppealUpdateMute.appeal.state.id, '3')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.type, 'editpunishment')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.state.id, '3')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.actor.name, account.name)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.oldReason, punishment.reason)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.newReason, 'test')
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.oldExpires, punishment.expires)
    assert.strictEqual(body.data.resolveAppealUpdateMute.comment.newExpires, 1000000000)

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
        query: `mutation resolveAppealUpdateMute {
          resolveAppealUpdateMute(id: 123123, input: {
            reason: "test", expires: 1000000000, soft: false
          }) {
            appeal {
              state {
                id
              }
            }
            comment {
              type
              created
              oldReason
              newReason
              oldExpires
              newExpires
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
