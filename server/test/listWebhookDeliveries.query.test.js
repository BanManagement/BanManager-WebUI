const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Query listWebhookDeliveries', () => {
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
        query: `query listWebhookDeliveries {
          listWebhookDeliveries(webhookId: 1) {
            total
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.errors)

    assert.strictEqual(body.data, null)
  })

  test('should require servers.manage permission', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listWebhookDeliveries {
        listWebhookDeliveries(webhookId: 1) {
          total
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should resolve all fields', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const serverObj = setup.serversPool.values().next().value
    const { config: server } = serverObj

    const [insertedId] = await setup.dbPool('bm_web_webhooks').insert({
      url: 'http://example.com',
      template_type: 'CUSTOM',
      content_type: 'APPLICATION_JSON',
      content_template: '{}',
      type: 'APPEAL_CREATED',
      server_id: server.id,
      created: setup.dbPool.raw('UNIX_TIMESTAMP()'),
      updated: setup.dbPool.raw('UNIX_TIMESTAMP()')
    })

    await setup.dbPool('bm_web_webhook_deliveries').insert({
      webhook_id: insertedId,
      content: '',
      response: '{}',
      created: setup.dbPool.raw('UNIX_TIMESTAMP()')
    })

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listWebhookDeliveries {
          listWebhookDeliveries(webhookId: ${insertedId}) {
            total
            records {
              content
              response
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.listWebhookDeliveries.total, 1)
    assert.deepStrictEqual(body.data.listWebhookDeliveries.records[0], {
      content: '',
      response: {}
    })
  })
})
