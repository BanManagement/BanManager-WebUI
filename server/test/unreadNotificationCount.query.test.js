const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount } = require('./lib')
const { getNotificationType } = require('../data/notification')
const { notifyReport, subscribeReport } = require('../data/notification/report')
const { createPlayer, createReport, createReportComment } = require('./fixtures')

describe('Query unreadNotificationCount', () => {
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
    const account = await getAccount(request, cookie)
    const serverObj = setup.serversPool.values().next().value
    const { config: server, pool } = serverObj
    const player = createPlayer()
    const report = createReport(player, account)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const comment = createReportComment(inserted, account)
    const [commentId] = await pool('bm_player_report_comments').insert(comment, ['id'])

    await subscribeReport(setup.dbPool, inserted, server.id, account.id)
    await notifyReport(setup.dbPool, getNotificationType('reportComment'), inserted, serverObj, commentId)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query unreadNotificationCount {
          unreadNotificationCount
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.unreadNotificationCount, 1)
  })

  test('should error if not logged in', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query unreadNotificationCount {
          unreadNotificationCount
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.errors)

    assert.strictEqual(body.data, null)
  })
})
