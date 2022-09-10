const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Mutation createNotificationRule', () => {
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
        query: `mutation createNotificationRule {
          createNotificationRule(input:{ type: APPEAL_CREATED, roles: [] }) {
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
        query: `mutation createNotificationRule {
          createNotificationRule(input:{ type: APPEAL_CREATED, roles: [] }) {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should error if server does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createNotificationRule {
          createNotificationRule(input:{ type: APPEAL_CREATED, roles: [], serverId: "asd" }) {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Server asd does not exist')
  })

  test('should error if role does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createNotificationRule {
          createNotificationRule(input:{ type: APPEAL_CREATED, roles: [{ id: "1234" }] }) {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Invalid role')
  })

  test('should create a notification rule', async () => {
    const { config: server } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createNotificationRule {
          createNotificationRule(input:{ type: APPEAL_CREATED, roles: [{ id: 2 }], serverId: "${server.id}" }) {
            id
            type
            roles {
              id
            }
            server {
              id
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.createNotificationRule.type, 'APPEAL_CREATED')
    assert.strictEqual(body.data.createNotificationRule.server.id, server.id)
    assert.strictEqual(body.data.createNotificationRule.roles[0].id, '2')
  })
})
