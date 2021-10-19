const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAccount, getAuthPassword } = require('./lib')
const { createPlayer, createBan, createAppeal } = require('./fixtures')

describe('Query appeal', () => {
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

  test('should error for invalid appeal', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query appeal {
          appeal(id: "1") {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Appeal 1 does not exist')
  })

  test('should resolve', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value

    const actor = createPlayer()
    const punishment = createBan(account, actor)

    await pool('bm_players').insert([actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal(id, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query appeal {
          appeal(id: "${inserted}") {
            id
            actor {
              id
              name
            }
            assignee {
              id
              name
            }
            reason
            created
            updated
            state {
              id
              name
            }
            acl {
              comment
              assign
              state
              delete
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.deepStrictEqual(body.data.appeal, {
      id: '1',
      reason: data.reason,
      created: data.created,
      updated: data.updated,
      assignee: null,
      state: {
        id: '1',
        name: 'Open'
      },
      actor: { id: unparse(account.id), name: account.name },
      acl: { comment: true, assign: false, state: false, delete: false }
    })
  })

  test('should resolve all fields', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value

    const actor = createPlayer()
    const assignee = createPlayer()

    await pool('bm_players').insert([actor, assignee])

    const punishment = createBan(account, actor)

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal(id, 'PlayerBan', server, account, assignee)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query appeal {
          appeal(id: "${inserted}") {
            id
            actor {
              id
              name
            }
            assignee {
              id
              name
            }
            reason
            created
            updated
            punishment {
              ... on PlayerBan {
                id
                actor {
                  id
                  name
                }
                created
                reason
                expires
              }
              ... on PlayerBanRecord {
                id
                actor {
                  id
                  name
                }
                pastActor {
                  id
                  name
                }
                created
                pastCreated
                reason
                expired
                acl {
                  delete
                }
              }
              ... on PlayerKick {
                id
                actor {
                  id
                  name
                }
                created
                reason
                acl {
                  delete
                }
              }
              ... on PlayerMute {
                id
                actor {
                  id
                  name
                }
                created
                reason
                expires
              }
              ... on PlayerMuteRecord {
                id
                actor {
                  id
                  name
                }
                pastActor {
                  id
                  name
                }
                created
                pastCreated
                reason
                expired
                acl {
                  delete
                }
              }
              ... on PlayerWarning {
                id
                actor {
                  id
                  name
                }
                created
                reason
                expires
                acl {
                  delete
                }
              }
            }
            state {
              id
              name
            }
            acl {
              comment
              assign
              state
              delete
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.deepStrictEqual(body.data.appeal, {
      id: inserted.toString(),
      reason: data.reason,
      created: data.created,
      updated: data.updated,
      assignee: { id: unparse(assignee.id), name: assignee.name },
      punishment: {
        id: id.toString(),
        actor: {
          id: unparse(actor.id),
          name: actor.name
        },
        reason: punishment.reason,
        created: punishment.created,
        expires: punishment.expires
      },
      state: {
        id: '1',
        name: 'Open'
      },
      actor: { id: unparse(account.id), name: account.name },
      acl: { comment: true, assign: true, state: true, delete: true }
    })
  })
})
