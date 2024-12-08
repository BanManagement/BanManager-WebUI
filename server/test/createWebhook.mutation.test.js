const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Mutation createWebhook', () => {
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
        query: `mutation createWebhook {
          createWebhook(input:{
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
        query: `mutation createWebhook {
          createWebhook(input:{
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

  test('should error if server does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createWebhook {
          createWebhook(input:{
            url: "http://example.com",
            type: APPEAL_CREATED,
            templateType: CUSTOM
            contentType: APPLICATION_JSON,
            contentTemplate: "{}",
            serverId: "asd"
          }) {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Server asd does not exist')
  })

  test('should error if the url is invalid', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createWebhook {
          createWebhook(input:{
            url: "com",
            type: APPEAL_CREATED,
            templateType: CUSTOM
            contentType: APPLICATION_JSON,
            contentTemplate: "{}",
          }) {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Argument "input" of "createWebhook" got invalid value "com" at "url". Must be in URI format')
  })

  test('should create a webhook', async () => {
    const { config: server } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createWebhook {
          createWebhook(input:{
            url: "http://example.com",
            type: APPEAL_CREATED,
            templateType: CUSTOM
            contentType: APPLICATION_JSON,
            contentTemplate: "{}",
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
    assert(body.data)

    assert.strictEqual(body.data.createWebhook.url, 'http://example.com')
    assert.strictEqual(body.data.createWebhook.type, 'APPEAL_CREATED')
    assert.strictEqual(body.data.createWebhook.templateType, 'CUSTOM')
    assert.strictEqual(body.data.createWebhook.contentType, 'APPLICATION_JSON')
    assert.strictEqual(body.data.createWebhook.contentTemplate, '{}')
    assert.strictEqual(body.data.createWebhook.server.id, server.id)
  })
})
