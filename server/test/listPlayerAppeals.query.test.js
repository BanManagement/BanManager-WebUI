const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createAppeal, createBan } = require('./fixtures')

describe('Query listPlayerAppeals', () => {
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

  test('should error if server does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerAppeals(serverId: "asd") {
            total
            records {
              id
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Server does not exist')
  })

  test('should error if limit too large', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server } = setup.serversPool.values().next().value
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerAppeals(serverId: "${server.id}", limit: 51) {
            total
            records {
              id
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Limit too large')
  })

  test('should resolve all fields', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value

    const actor = createPlayer()
    const punishment = createBan(account, actor)

    await pool('bm_players').insert([actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account, actor)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerAppeals {
            total
            records {
              id
              actor {
                id
                name
              }
              assignee {
                id
                name
              }
              punishmentActor {
                id
                name
              }
              punishmentType
              punishmentReason
              punishmentCreated
              punishmentExpires
              punishmentSoft
              punishmentPoints
              reason
              created
              updated
              state {
                id
                name
              }
              server {
                id
                name
              }
              acl {
                state
                assign
                comment
                delete
              }
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.listPlayerAppeals, {
      total: 1,
      records: [{
        id: '' + inserted,
        reason: data.reason,
        created: data.created,
        updated: data.updated,
        assignee: { id: unparse(actor.id), name: actor.name },
        state: {
          id: '1',
          name: 'Open'
        },
        actor: { id: unparse(account.id), name: account.name },
        punishmentActor: { id: unparse(actor.id), name: actor.name },
        acl: { comment: true, assign: true, state: true, delete: true },
        server: {
          id: server.id,
          name: server.name
        },
        punishmentCreated: punishment.created,
        punishmentExpires: punishment.expires,
        punishmentPoints: null,
        punishmentReason: punishment.reason,
        punishmentSoft: null,
        punishmentType: 'PlayerBan'
      }]
    })
  })

  test('should filter actor', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value

    const actor = createPlayer()
    const player = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([actor, player])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, player, actor)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerAppeals(actor: "${unparse(player.id)}") {
            total
            records {
              id
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.listPlayerAppeals, {
      total: 1,
      records: [{
        id: inserted.toString()
      }]
    })
  })

  test('should filter assigned', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value

    const actor = createPlayer()
    const player = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([actor, player])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, player, actor)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerAppeals(assigned: "${unparse(actor.id)}") {
            total
            records {
              id
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.listPlayerAppeals, {
      total: 1,
      records: [{
        id: inserted.toString()
      }]
    })
  })

  test('should filter state', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value

    const actor = createPlayer()
    const player = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([actor, player])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, player, actor, 2)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerAppeals(state: 2) {
            total
            records {
              id
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.listPlayerAppeals, {
      total: 1,
      records: [{
        id: inserted.toString()
      }]
    })
  })

  test('should order by created DESC', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value

    const actor = createPlayer()
    const player = createPlayer()
    const punishment = createBan(player, actor)
    const secondPunishment = createBan(actor, account)

    await pool('bm_players').insert([actor, player])

    const [firstId] = await pool('bm_player_bans').insert(punishment, ['id'])
    const [secondId] = await pool('bm_player_bans').insert(secondPunishment, ['id'])
    const appeal = createAppeal({ ...punishment, id: firstId }, 'PlayerBan', server, player, actor)
    const [first] = await pool('bm_web_appeals').insert({ ...appeal, created: appeal.created + 1000 }, ['id'])
    const [second] = await pool('bm_web_appeals').insert({ ...createAppeal({ ...secondPunishment, id: secondId }, 'PlayerBan', server, actor, actor), created: appeal.created }, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerAppeals(order: created_DESC, assigned: "${unparse(actor.id)}") {
            total
            records {
              id
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.listPlayerAppeals, {
      total: 2,
      records: [{ id: first.toString() }, { id: second.toString() }]
    })
  })

  test('should list no appeals', async () => {
    const { config: server, pool } = setup.serversPool.values().next().value

    const actor = createPlayer()
    const player = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([actor, player])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, player)

    await pool('bm_web_appeals').insert(data)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerAppeals {
            total
            records {
              id
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.listPlayerAppeals, {
      total: 0,
      records: []
    })
  })

  test('should list own appeals only', async () => {
    const cookie = await getAuthPassword(request, 'guest@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const actor = createPlayer()
    const punishment = createBan(account, actor)

    await pool('bm_players').insert(actor)

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account)

    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'view.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerAppeals {
            total
            records {
              id
            }
          }
        }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.listPlayerAppeals, {
      total: 1,
      records: [{ id: inserted.toString() }]
    })
  })

  test('should list assigned appeals only', async () => {
    const cookie = await getAuthPassword(request, 'guest@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const actor = createPlayer()
    const player = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([actor, player])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, player, account)

    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'view.assigned')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerAppeals {
            total
            records {
              id
              assignee {
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

    assert.deepStrictEqual(body.data.listPlayerAppeals, {
      total: 1,
      records: [{ id: inserted.toString(), assignee: { id: unparse(account.id) } }]
    })
  })

  test('should list no appeals', async () => {
    const cookie = await getAuthPassword(request, 'guest@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value
    const actor = createPlayer()
    const player = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([actor, player])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, player)

    await pool('bm_web_appeals').insert(data)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerAppeals(serverId: "${server.id}") {
            total
            records {
              id
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.listPlayerAppeals, {
      total: 0,
      records: []
    })
  })
})
