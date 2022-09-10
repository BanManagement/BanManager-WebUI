const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Mutation updateNotificationRule', () => {
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
        query: `mutation updateNotificationRule {
        updateNotificationRule(id: 1, input:{ type: APPEAL_CREATED, roles: [{ id: 2 }] }) {
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
        query: `mutation updateNotificationRule {
        updateNotificationRule(id: 123123, input:{ type: APPEAL_CREATED, roles: [{ id: 2 }] }) {
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
        query: `mutation updateNotificationRule {
        updateNotificationRule(id: 123123, input:{ type: APPEAL_CREATED, roles: [{ id: 2 }] }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Notification rule 123123 does not exist')
  })

  test('should update notification rule', async () => {
    const { config: server } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const [insertedId] = await setup.dbPool('bm_web_notification_rules').insert({ type: 'APPEAL_CREATED', created: setup.dbPool.raw('UNIX_TIMESTAMP()'), updated: setup.dbPool.raw('UNIX_TIMESTAMP()') })
    await setup.dbPool('bm_web_notification_rule_roles').insert({ notification_rule_id: insertedId, role_id: 3 })

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation updateNotificationRule {
        updateNotificationRule(id: ${insertedId}, input:{ type: APPEAL_CREATED, roles: [{ id: 2 }], serverId: "${server.id}" }) {
          id
          type
          server {
            id
          }
          roles {
            id
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.data.updateNotificationRule.id, insertedId.toString())
    assert.strictEqual(body.data.updateNotificationRule.type, 'APPEAL_CREATED')
    assert.strictEqual(body.data.updateNotificationRule.server.id, server.id)
    assert.strictEqual(body.data.updateNotificationRule.roles[0].id, '2')

    const results = await setup.dbPool('bm_web_notification_rule_roles').where('notification_rule_id', insertedId)

    assert.strictEqual(results.length, 1)
  })
})
