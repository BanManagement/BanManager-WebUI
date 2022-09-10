const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Mutation deleteNotificationRule', () => {
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

  test('should error if unauthenticated', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteNotificationRule {
        deleteNotificationRule(id: 1) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should require servers.manage permission', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteNotificationRule {
        deleteNotificationRule(id: 123123) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should error if notification rule does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteNotificationRule {
        deleteNotificationRule(id: 123123) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Notification rule 123123 does not exist')
  })

  test('should delete notification rule', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const [insertedId] = await setup.dbPool('bm_web_notification_rules').insert({ type: 'APPEAL_CREATED', created: setup.dbPool.raw('UNIX_TIMESTAMP()'), updated: setup.dbPool.raw('UNIX_TIMESTAMP()') })
    await setup.dbPool('bm_web_notification_rule_roles').insert({ notification_rule_id: insertedId, role_id: 3 })

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteNotificationRule {
        deleteNotificationRule(id: ${insertedId}) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.data.deleteNotificationRule.id, insertedId.toString())

    const results = await setup.dbPool('bm_web_notification_rule_roles').where('notification_rule_id', insertedId)

    assert.strictEqual(results.length, 0)
  })
})
