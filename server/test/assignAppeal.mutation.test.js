const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createAppeal, createBan } = require('./fixtures')
const { getUnreadNotificationsCount } = require('../data/notification')
const { getAppealWatchers } = require('../data/notification/appeal')

describe('Mutation assignAppeal', () => {
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
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(actor, actor)

    await pool('bm_players').insert([actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, actor)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignAppeal {
        assignAppeal(player: "${unparse(player.id)}", id: ${inserted}) {
          appeal {
            id
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should allow update.assign.any', async () => {
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
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'update.assign.any', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignAppeal {
        assignAppeal(player: "${unparse(actor.id)}", id: ${inserted}) {
          appeal {
            id
          }
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.assignAppeal.appeal.id, '' + inserted)
  })

  test('should allow update.assign.own', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const actor = createPlayer()
    const punishment = createBan(account, actor)

    await pool('bm_players').insert([actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'update.assign.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignAppeal {
        assignAppeal(player: "${unparse(actor.id)}", id: ${inserted}) {
          appeal {
            id
          }
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.assignAppeal.appeal.id, '' + inserted)
  })

  test('should allow update.assign.assigned', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, player, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'update.assign.assigned', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignAppeal {
        assignAppeal(player: "${unparse(actor.id)}", id: ${inserted}) {
          appeal {
            id
          }
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.assignAppeal.appeal.id, '' + inserted)
  })

  test('should subscribe player and notify appeal assigned', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, player, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, actor, 'player.appeals', 'update.assign.assigned', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignAppeal {
        assignAppeal(player: "${unparse(actor.id)}", id: ${inserted}) {
          appeal {
            id
          }
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.assignAppeal.appeal.id, '' + inserted)

    const watchers = await getAppealWatchers(setup.dbPool, inserted)
    const notificationCount = await getUnreadNotificationsCount(setup.dbPool, actor.id)

    assert.strictEqual(watchers.filter(playerId => playerId.equals(actor.id)).length, 1)
    assert.strictEqual(notificationCount, 1)
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
        query: `mutation assignAppeal {
        assignAppeal(player: "${unparse(player.id)}", id: 123123) {
          appeal {
            id
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Appeal 123123 does not exist')
  })

  test('should error if player does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignAppeal {
        assignAppeal(player: "${unparse(player.id)}", id: 3) {
          appeal {
            id
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, `Player ${unparse(player.id)} does not exist`)
  })

  test('should error if player is the actor', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const actor = createPlayer()
    const punishment = createBan(account, actor)

    await pool('bm_players').insert(actor)

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignAppeal {
        assignAppeal(player: "${unparse(account.id)}", id: ${inserted}) {
          appeal {
            id
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'You cannot assign an appeal to the player which created it')
  })

  test('should assign player', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignAppeal {
        assignAppeal(player: "${unparse(player.id)}", id: 3) {
          appeal {
            id
            assignee {
              id
            }
          }
          comment {
            type
            assignee {
              id
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.assignAppeal.appeal.id, '3')
    assert.strictEqual(body.data.assignAppeal.appeal.assignee.id, unparse(player.id))
    assert.strictEqual(body.data.assignAppeal.comment.type, 'assigned')
    assert.strictEqual(body.data.assignAppeal.comment.assignee.id, unparse(player.id))
  })
})
