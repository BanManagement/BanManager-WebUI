const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAccount, getAuthPassword } = require('./lib')
const { createPlayer, createReport } = require('./fixtures')

describe('Query report', () => {
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

  test('should error for invalid server', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query report {
          report(serverId: "asdasd", id: "1") {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Server not found')
  })

  test('should error for invalid report', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server } = setup.serversPool.values().next().value
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query report {
          report(serverId: "${server.id}", id: "1") {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Report not found')
  })

  test('should resolve', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value

    const actor = createPlayer()
    const data = createReport(account, actor)

    await pool('bm_players').insert([actor])

    const [inserted] = await pool('bm_player_reports').insert(data, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query report {
          report(serverId: "${server.id}", id: "${inserted}") {
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
            viewerSubscription {
              state
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.deepStrictEqual(body.data.report, {
      id: '1',
      reason: data.reason,
      created: data.created,
      updated: data.updated,
      assignee: null,
      playerLocation: null,
      actorLocation: null,
      state: {
        id: '1',
        name: 'Open'
      },
      actor: { id: unparse(actor.id), name: actor.name },
      player: { id: unparse(account.id), name: account.name },
      acl: { comment: true, assign: false, state: false, delete: false },
      viewerSubscription: null
    })
  })

  test('should resolve all fields', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value

    const player = createPlayer()
    const actor = createPlayer()
    const assignee = createPlayer()
    const data = createReport(player, actor, assignee)

    await pool('bm_players').insert([player, actor, assignee])

    const [inserted] = await pool('bm_player_reports').insert(data, ['id'])

    await pool('bm_player_report_locations').insert([
      { report_id: inserted, player_id: player.id, x: 1, y: 2, z: 3, world: 'world', pitch: 1, yaw: 1 },
      { report_id: inserted, player_id: actor.id, x: 1, y: 2, z: 3, world: 'world', pitch: 1, yaw: 1 }
    ])
    await pool('bm_player_report_commands').insert([
      { report_id: inserted, actor_id: actor.id, command: '/ban', args: `${player.name} Hax`, created: data.created, updated: data.created },
      { report_id: inserted, actor_id: actor.id, command: '/plot', args: `remove ${player.name}`, created: data.created, updated: data.created }
    ])
    await pool('bm_server_logs').insert([
      { id: 10, message: 'Testing logs', created: data.created },
      { id: 11, message: 'More logs', created: data.created }
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
        query: `query report {
          report(serverId: "${server.id}", id: "${inserted}") {
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
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.deepStrictEqual(body.data.report, {
      id: '2',
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
        { actor: { id: unparse(actor.id), name: actor.name }, args: `${player.name} Hax`, command: '/ban', created: data.created, id: '1', updated: data.created },
        { actor: { id: unparse(actor.id), name: actor.name }, args: `remove ${player.name}`, command: '/plot', created: data.created, id: '2', updated: data.created }
      ],
      serverLogs: [
        { id: '1', log: { created: data.created, message: 'Testing logs' } },
        { id: '2', log: { created: data.created, message: 'More logs' } }
      ]
    })
  })
})
