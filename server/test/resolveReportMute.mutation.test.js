const assert = require('assert')
const supertest = require('supertest')
const { unparse } = require('uuid-parse')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createMute, createReport } = require('./fixtures')
const { getUnreadNotificationsCount } = require('../data/notification')
const { getReportWatchers, subscribeReport } = require('../data/notification/report')

describe('Mutation resolveReportMute', () => {
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
    const player = createPlayer()
    const { config: server } = setup.serversPool.values().next().value
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveReportMute {
          resolveReportMute(serverId: "${server.id}", report: 1, input: {
            player: "${unparse(player.id)}", reason: "test", expires: 1000000000, server: "asd", soft: false
          }) {
            state {
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

  test('should allow update.state.any', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, player)
    const mute = createMute(player, account)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const reportRole = await setTempRole(setup.dbPool, account, 'player.reports', 'update.state.any', 'view.any')
    const muteRole = await setTempRole(setup.dbPool, account, 'player.mutes', 'create')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveReportMute {
          resolveReportMute(serverId: "${server.id}", report: ${inserted}, input: {
            player: "${unparse(player.id)}", reason: "${mute.reason}", expires: ${Math.floor(Date.now() / 1000) + 86400}, server: "${server.id}", soft: false
          }) {
            state {
              id
            }
            commands {
              command
              args
              created
              actor {
                id
                name
              }
            }
          }
        }`
      })

    await reportRole.reset()
    await muteRole.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.resolveReportMute.state.id, '3')
    assert.strictEqual(body.data.resolveReportMute.commands.length, 1)
    assert.strictEqual(body.data.resolveReportMute.commands[0].command, 'tempmute')
    assert.strictEqual(body.data.resolveReportMute.commands[0].args, `${player.name} 24h ${mute.reason}`)
    assert.strictEqual(body.data.resolveReportMute.commands[0].actor.name, account.name)
  })

  test('should allow update.state.own', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, account)
    const mute = createMute(player, account)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const reportRole = await setTempRole(setup.dbPool, account, 'player.reports', 'update.state.own')
    const muteRole = await setTempRole(setup.dbPool, account, 'player.mutes', 'create')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveReportMute {
        resolveReportMute(serverId: "${server.id}", report: ${inserted}, input: {
          player: "${unparse(player.id)}", reason: "${mute.reason}", expires: 0, server: "${server.id}", soft: false
        }) {
          state {
            id
          }
          commands {
            command
            args
            created
            actor {
              id
              name
            }
          }
        }
      }`
      })

    await reportRole.reset()
    await muteRole.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.resolveReportMute.state.id, '3')
    assert.strictEqual(body.data.resolveReportMute.commands.length, 1)
    assert.strictEqual(body.data.resolveReportMute.commands[0].command, 'mute')
    assert.strictEqual(body.data.resolveReportMute.commands[0].args, `${player.name} ${mute.reason}`)
    assert.strictEqual(body.data.resolveReportMute.commands[0].actor.name, account.name)
  })

  test('should allow update.state.assigned', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, account)
    const mute = createMute(player, account)

    report.assignee_id = account.id

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const reportRole = await setTempRole(setup.dbPool, account, 'player.reports', 'update.state.assigned')
    const muteRole = await setTempRole(setup.dbPool, account, 'player.mutes', 'create')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation reportState {
        resolveReportMute(serverId: "${server.id}", report: ${inserted}, input: {
          player: "${unparse(player.id)}", reason: "${mute.reason}", expires: 0, server: "${server.id}", soft: false
        }) {
          state {
            id
          }
          commands {
            command
            args
            created
            actor {
              id
              name
            }
          }
        }
      }`
      })

    await reportRole.reset()
    await muteRole.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.resolveReportMute.state.id, '3')
    assert.strictEqual(body.data.resolveReportMute.commands.length, 1)
    assert.strictEqual(body.data.resolveReportMute.commands[0].command, 'mute')
    assert.strictEqual(body.data.resolveReportMute.commands[0].args, `${player.name} ${mute.reason}`)
    assert.strictEqual(body.data.resolveReportMute.commands[0].actor.name, account.name)
  })

  test('should allow update.state.reported', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(account, player)
    const mute = createMute(player, account)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const reportRole = await setTempRole(setup.dbPool, account, 'player.reports', 'update.state.reported')
    const muteRole = await setTempRole(setup.dbPool, account, 'player.mutes', 'create')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation reportState {
        resolveReportMute(serverId: "${server.id}", report: ${inserted}, input: {
          player: "${unparse(player.id)}", reason: "${mute.reason}", expires: 0, server: "${server.id}", soft: false
        }) {
          state {
            id
          }
          commands {
            command
            args
            created
            actor {
              id
              name
            }
          }
        }
      }`
      })

    await reportRole.reset()
    await muteRole.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.resolveReportMute.state.id, '3')
    assert.strictEqual(body.data.resolveReportMute.commands.length, 1)
    assert.strictEqual(body.data.resolveReportMute.commands[0].command, 'mute')
    assert.strictEqual(body.data.resolveReportMute.commands[0].args, `${player.name} ${mute.reason}`)
    assert.strictEqual(body.data.resolveReportMute.commands[0].actor.name, account.name)
  })

  test('should subscribe player and notify of state change', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(account, player)
    const mute = createMute(player, account)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])

    await subscribeReport(setup.dbPool, inserted, server.id, player.id)

    const role = await setTempRole(setup.dbPool, player, 'player.reports', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation reportState {
        resolveReportMute(serverId: "${server.id}", report: ${inserted}, input: {
          player: "${unparse(player.id)}", reason: "${mute.reason}", expires: 0, server: "${server.id}", soft: false
        }) {
          state {
            id
          }
          commands {
            command
            args
            created
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
    assert.strictEqual(body.data.resolveReportMute.state.id, '3')
    assert.strictEqual(body.data.resolveReportMute.commands.length, 1)
    assert.strictEqual(body.data.resolveReportMute.commands[0].command, 'mute')
    assert.strictEqual(body.data.resolveReportMute.commands[0].args, `${player.name} ${mute.reason}`)
    assert.strictEqual(body.data.resolveReportMute.commands[0].actor.name, account.name)

    const watchers = await getReportWatchers(setup.dbPool, inserted, server.id)
    const notificationCount = await getUnreadNotificationsCount(setup.dbPool, player.id)

    assert.strictEqual(watchers.filter(playerId => playerId.equals(account.id)).length, 1)
    assert.strictEqual(notificationCount, 1)
  })

  test('should error if report does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const mute = createMute(player, account)

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveReportMute {
        resolveReportMute(serverId: "${server.id}", report: 123123, input: {
          player: "${unparse(player.id)}", reason: "${mute.reason}", expires: 0, server: "${server.id}", soft: false
        }) {
          state {
            id
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Report 123123 does not exist')
  })

  test('should error if server does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const mute = createMute(player, player)

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation resolveReportMute {
        resolveReportMute(serverId: "3", report: 3, input: {
          player: "${unparse(player.id)}", reason: "${mute.reason}", expires: 0, server: "3", soft: false
        }) {
          state {
            id
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Server does not exist')
  })
})
