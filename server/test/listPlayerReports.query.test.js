const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
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
})
