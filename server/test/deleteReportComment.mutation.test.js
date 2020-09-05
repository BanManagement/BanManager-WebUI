const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createReport } = require('./fixtures')

describe('Mutation deleteReportComment', () => {
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
    const { config: server } = setup.serversPool.values().next().value
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteReportComment {
          deleteReportComment(serverId: "${server.id}", id: 1) {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should allow comment.delete.any', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, player)

    await pool('bm_players').insert(player)

    const [reportId] = await pool('bm_player_reports').insert(report, ['id'])
    const [id] = await pool('bm_player_report_comments').insert({
      report_id: reportId,
      actor_id: player.id,
      comment: 'asdasdasd',
      created: report.created,
      updated: report.updated
    }, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'comment.delete.any', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteReportComment {
          deleteReportComment(serverId: "${server.id}", id: ${id}) {
            acl {
              delete
            }
          }
        }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.deleteReportComment.acl.delete, true)
  })

  test('should allow comment.delete.own', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, account)

    await pool('bm_players').insert(player)

    const [reportId] = await pool('bm_player_reports').insert(report, ['id'])
    const [id] = await pool('bm_player_report_comments').insert({
      report_id: reportId,
      actor_id: account.id,
      comment: 'asdasdasd',
      created: report.created,
      updated: report.updated
    }, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'comment.delete.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteReportComment {
          deleteReportComment(serverId: "${server.id}", id: ${id}) {
            acl {
              delete
            }
          }
        }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.deleteReportComment.acl.delete, true)
  })

  test('should error if comment does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server } = setup.serversPool.values().next().value
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteReportComment {
          deleteReportComment(serverId: "${server.id}", id: 123123) {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Report comment not found')
  })

  test('should error if server does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteReportComment {
          deleteReportComment(serverId: "3", id: 3) {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Server not found')
  })
})
