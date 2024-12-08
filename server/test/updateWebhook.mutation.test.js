const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Mutation updateWebhook', () => {
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
        query: `mutation updateWebhook {
          updateWebhook(id: 1, input:{
            url: "http://example.com",
            type: APPEAL_CREATED,
            templateType: CUSTOM
            contentType: APPLICATION_JSON,
            contentTemplate: "{}",
            serverId: "1"
          }) {
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
        query: `mutation updateWebhook {
          updateWebhook(id: 123123, input:{
            url: "http://example.com",
            type: APPEAL_CREATED,
            templateType: CUSTOM
            contentType: APPLICATION_JSON,
            contentTemplate: "{}",
            serverId: "1"
          }) {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should error if webhook does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation updateWebhook {
          updateWebhook(id: 123123, input:{
            url: "http://example.com",
            type: APPEAL_CREATED,
            templateType: CUSTOM
            contentType: APPLICATION_JSON,
            contentTemplate: "{}",
            serverId: "1"
          }) {
            id
         }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Webhook 123123 does not exist')
  })

  test('should update webhook', async () => {
    const { config: server } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const [insertedId] = await setup.dbPool('bm_web_webhooks').insert({
      url: 'http://example.com',
      template_type: 'CUSTOM',
      content_type: 'APPLICATION_JSON',
      content_template: '{}',
      type: 'APPEAL_CREATED',
      created: setup.dbPool.raw('UNIX_TIMESTAMP()'),
      updated: setup.dbPool.raw('UNIX_TIMESTAMP()')
    })

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation updateWebhook {
          updateWebhook(id: ${insertedId}, input:{
            url: "https://banmanagement.com",
            type: APPEAL_CREATED,
            templateType: CUSTOM
            contentType: APPLICATION_JSON,
            contentTemplate: "{\\"foo\\":\\"bar\\"}",
            serverId: "${server.id}"
          }) {
            id
            url
            type
            templateType
            contentType
            contentTemplate
            server {
              id
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.data.updateWebhook.id, insertedId.toString())
    assert.strictEqual(body.data.updateWebhook.url, 'https://banmanagement.com')
    assert.strictEqual(body.data.updateWebhook.type, 'APPEAL_CREATED')
    assert.strictEqual(body.data.updateWebhook.templateType, 'CUSTOM')
    assert.strictEqual(body.data.updateWebhook.contentType, 'APPLICATION_JSON')
    assert.strictEqual(body.data.updateWebhook.contentTemplate, '{"foo":"bar"}')
    assert.strictEqual(body.data.updateWebhook.server.id, server.id)
  })
})
