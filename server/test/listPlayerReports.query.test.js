const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createReport } = require('./fixtures')

describe('Query listPlayerReports', () => {
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
          listPlayerReports(serverId: "asd") {
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
          listPlayerReports(serverId: "${server.id}", limit: 51) {
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
    const { config: server, pool } = setup.serversPool.values().next().value

    const player = createPlayer()
    const actor = createPlayer()
    const assignee = createPlayer()
    const data = createReport(player, actor, assignee)
    const now = Math.floor(Date.now() / 1000)

    await pool('bm_players').insert([player, actor, assignee])

    const [inserted] = await pool('bm_player_reports').insert(data, ['id'])

    await pool('bm_player_report_locations').insert([
      { report_id: inserted, player_id: player.id, x: 1, y: 2, z: 3, world: 'world', pitch: 1, yaw: 1 },
      { report_id: inserted, player_id: actor.id, x: 1, y: 2, z: 3, world: 'world', pitch: 1, yaw: 1 }
    ])
    await pool('bm_player_report_commands').insert([
      { report_id: inserted, actor_id: actor.id, command: '/ban', args: `${player.name} Hax`, created: now, updated: now },
      { report_id: inserted, actor_id: actor.id, command: '/plot', args: `remove ${player.name}`, created: now, updated: now }
    ])
    await pool('bm_server_logs').insert([
      { id: 10, message: 'Testing logs', created: now },
      { id: 11, message: 'More logs', created: now }
    ])
    await pool('bm_report_logs').insert([
      { report_id: inserted, log_id: 10 },
      { report_id: inserted, log_id: 11 }
    ])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerReports(serverId: "${server.id}") {
            total
            records {
              id
              player {
                id
                name
              }
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
              playerLocation {
                world
                x
                y
                z
                yaw
                pitch
              }
              actorLocation {
                world
                x
                y
                z
                yaw
                pitch
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
              serverLogs {
                id
                log {
                  message
                  created
                }
              }
              commands {
                id
                command
                args
                created
                updated
                actor {
                  id
                  name
                }
              }
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.listPlayerReports, {
      total: 1,
      records: [{
        id: '1',
        reason: data.reason,
        created: data.created,
        updated: data.updated,
        assignee: { id: unparse(assignee.id), name: assignee.name },
        playerLocation: { x: 1, y: 2, z: 3, world: 'world', pitch: 1, yaw: 1 },
        actorLocation: { x: 1, y: 2, z: 3, world: 'world', pitch: 1, yaw: 1 },
        state: {
          id: '1',
          name: 'Open'
        },
        actor: { id: unparse(actor.id), name: actor.name },
        player: { id: unparse(player.id), name: player.name },
        acl: { comment: true, assign: true, state: true, delete: true },
        commands: [
          { actor: { id: unparse(actor.id), name: actor.name }, args: `${player.name} Hax`, command: '/ban', created: now, id: '1', updated: now },
          { actor: { id: unparse(actor.id), name: actor.name }, args: `remove ${player.name}`, command: '/plot', created: now, id: '2', updated: now }
        ],
        serverLogs: [
          { id: '1', log: { created: now, message: 'Testing logs' } },
          { id: '2', log: { created: now, message: 'More logs' } }
        ]
      }]
    })
  })

  test('should filter actor', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value

    const player = createPlayer()
    const actor = createPlayer()
    const assignee = createPlayer()
    const data = createReport(player, actor, assignee)

    await pool('bm_players').insert([player, actor, assignee])
    await pool('bm_player_reports').insert([createReport(player, assignee), createReport(player, assignee), createReport(player, assignee)])

    const [inserted] = await pool('bm_player_reports').insert(data, ['id'])
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerReports(serverId: "${server.id}", actor: "${unparse(actor.id)}") {
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
    assert.deepStrictEqual(body.data.listPlayerReports, {
      total: 1,
      records: [{
        id: inserted.toString()
      }]
    })
  })

  test('should filter assigned', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value

    const player = createPlayer()
    const actor = createPlayer()
    const assignee = createPlayer()
    const data = createReport(player, actor, assignee)

    await pool('bm_players').insert([player, actor, assignee])
    await pool('bm_player_reports').insert([createReport(player, actor), createReport(player, actor), createReport(player, actor)])

    const [inserted] = await pool('bm_player_reports').insert(data, ['id'])
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerReports(serverId: "${server.id}", assigned: "${unparse(assignee.id)}") {
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
    assert.deepStrictEqual(body.data.listPlayerReports, {
      total: 1,
      records: [{
        id: inserted.toString()
      }]
    })
  })

  test('should filter player', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value

    const player = createPlayer()
    const actor = createPlayer()
    const assignee = createPlayer()
    const data = createReport(player, actor, assignee)

    await pool('bm_players').insert([player, actor, assignee])
    await pool('bm_player_reports').insert([createReport(assignee, actor), createReport(assignee, actor), createReport(assignee, actor)])

    const [inserted] = await pool('bm_player_reports').insert(data, ['id'])
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerReports(serverId: "${server.id}", player: "${unparse(player.id)}") {
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
    assert.deepStrictEqual(body.data.listPlayerReports, {
      total: 1,
      records: [{
        id: inserted.toString()
      }]
    })
  })

  test('should filter state', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value

    const player = createPlayer()
    const actor = createPlayer()
    const assignee = createPlayer()
    const data = createReport(player, actor, assignee)

    await pool('bm_players').insert([player, actor, assignee])
    await pool('bm_player_reports').insert([createReport(assignee, actor), createReport(assignee, actor), createReport(assignee, actor)])

    const [inserted] = await pool('bm_player_reports').insert({ ...data, state_id: 2 }, ['id'])
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerReports(serverId: "${server.id}", state: 2) {
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
    assert.deepStrictEqual(body.data.listPlayerReports, {
      total: 1,
      records: [{
        id: inserted.toString()
      }]
    })
  })

  test('should order by created DESC', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value

    const player = createPlayer()
    const actor = createPlayer()
    const data = createReport(player, actor)

    await pool('bm_players').insert([player, actor])

    const [second] = await pool('bm_player_reports').insert(data, ['id'])
    const [first] = await pool('bm_player_reports').insert({ ...data, created: data.created + 1000 }, ['id'])
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerReports(serverId: "${server.id}", player: "${unparse(player.id)}", order: created_DESC) {
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
    assert.deepStrictEqual(body.data.listPlayerReports, {
      total: 2,
      records: [{ id: first.toString() }, { id: second.toString() }]
    })
  })

  test('should list no reports', async () => {
    const { config: server, pool } = setup.serversPool.values().next().value

    const player = createPlayer()
    const actor = createPlayer()
    const data = createReport(player, actor)

    await pool('bm_players').insert([player, actor])
    await pool('bm_player_reports').insert(data)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerReports(serverId: "${server.id}") {
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
    assert.deepStrictEqual(body.data.listPlayerReports, {
      total: 0,
      records: []
    })
  })

  test('should list own reports only', async () => {
    const cookie = await getAuthPassword(request, 'guest@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, account)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'view.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerReports(serverId: "${server.id}") {
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
    assert.deepStrictEqual(body.data.listPlayerReports, {
      total: 1,
      records: [{ id: inserted.toString() }]
    })
  })

  test('should list assigned reports only', async () => {
    const cookie = await getAuthPassword(request, 'guest@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const report = createReport(player, actor, account)

    await pool('bm_players').insert([player, actor])

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'view.assigned')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerReports(serverId: "${server.id}") {
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
    assert.deepStrictEqual(body.data.listPlayerReports, {
      total: 1,
      records: [{ id: inserted.toString(), assignee: { id: unparse(account.id) } }]
    })
  })

  test('should list reported reports only', async () => {
    const cookie = await getAuthPassword(request, 'guest@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const actor = createPlayer()
    const report = createReport(account, actor)

    await pool('bm_players').insert(actor)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'view.reported')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerReports(serverId: "${server.id}") {
            total
            records {
              id
              player {
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
    assert.deepStrictEqual(body.data.listPlayerReports, {
      total: 1,
      records: [{ id: inserted.toString(), player: { id: unparse(account.id) } }]
    })
  })

  test('should list no reports', async () => {
    const cookie = await getAuthPassword(request, 'guest@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const actor = createPlayer()
    const report = createReport(account, actor)

    await pool('bm_players').insert(actor)

    await pool('bm_player_reports').insert(report)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query {
          listPlayerReports(serverId: "${server.id}") {
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
    assert.deepStrictEqual(body.data.listPlayerReports, {
      total: 0,
      records: []
    })
  })
})
