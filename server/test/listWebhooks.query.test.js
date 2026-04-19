const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Query listWebhooks', () => {
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
        query: `query listWebhooks {
          listWebhooks {
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
        query: `query listWebhooks {
        listWebhooks {
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

    await setup.dbPool('bm_web_webhooks').insert({
      url: 'http://example.com',
      template_type: 'CUSTOM',
      content_type: 'APPLICATION_JSON',
      content_template: '{}',
      type: 'APPEAL_CREATED',
      server_id: server.id,
      created: setup.dbPool.raw('UNIX_TIMESTAMP()'),
      updated: setup.dbPool.raw('UNIX_TIMESTAMP()')
    })

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listWebhooks {
          listWebhooks {
            total
            records {
              url
              type
              contentType
              contentTemplate
              templateType
              server {
                id
                name
              }
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.listWebhooks.total, 1)
    assert.deepStrictEqual(body.data.listWebhooks.records[0], {
      type: 'APPEAL_CREATED',
      contentType: 'APPLICATION_JSON',
      contentTemplate: '{}',
      templateType: 'CUSTOM',
      url: 'http://example.com',
      server: {
        id: server.id.toString(),
        name: server.name
      }
    })
  })

  test('should return records ordered by updated DESC so pagination is deterministic', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const serverObj = setup.serversPool.values().next().value
    const { config: server } = serverObj

    await setup.dbPool('bm_web_webhook_deliveries').delete()
    await setup.dbPool('bm_web_webhooks').delete()

    const baseTimestamp = Math.floor(Date.now() / 1000)
    await setup.dbPool('bm_web_webhooks').insert([
      {
        url: 'http://example.com/oldest',
        template_type: 'CUSTOM',
        content_type: 'APPLICATION_JSON',
        content_template: '{}',
        type: 'APPEAL_CREATED',
        server_id: server.id,
        created: baseTimestamp,
        updated: baseTimestamp
      },
      {
        url: 'http://example.com/middle',
        template_type: 'CUSTOM',
        content_type: 'APPLICATION_JSON',
        content_template: '{}',
        type: 'APPEAL_CREATED',
        server_id: server.id,
        created: baseTimestamp + 1,
        updated: baseTimestamp + 1
      },
      {
        url: 'http://example.com/newest',
        template_type: 'CUSTOM',
        content_type: 'APPLICATION_JSON',
        content_template: '{}',
        type: 'APPEAL_CREATED',
        server_id: server.id,
        created: baseTimestamp + 2,
        updated: baseTimestamp + 2
      }
    ])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listWebhooks {
          listWebhooks {
            records {
              url
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)
    assert.strictEqual(body.errors, undefined)
    assert.deepStrictEqual(
      body.data.listWebhooks.records.map(r => r.url),
      [
        'http://example.com/newest',
        'http://example.com/middle',
        'http://example.com/oldest'
      ]
    )
  })
})
