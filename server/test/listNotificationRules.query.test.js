const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Query listNotificationRules', () => {
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
        query: `query listNotificationRules {
          listNotificationRules {
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
        query: `query listNotificationRules {
        listNotificationRules {
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

    const [insertedId] = await setup.dbPool('bm_web_notification_rules').insert({
      type: 'APPEAL_CREATED',
      server_id: server.id,
      created: setup.dbPool.raw('UNIX_TIMESTAMP()'),
      updated: setup.dbPool.raw('UNIX_TIMESTAMP()')
    })
    await setup.dbPool('bm_web_notification_rule_roles').insert({ notification_rule_id: insertedId, role_id: 3 })

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listNotificationRules {
          listNotificationRules {
            total
            records {
              type
              roles {
                id
                name
              }
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
    assert.strictEqual(body.data.listNotificationRules.total, 1)
    assert.deepStrictEqual(body.data.listNotificationRules.records[0], {
      type: 'APPEAL_CREATED',
      roles: [{
        id: '3',
        name: 'Admin'
      }],
      server: {
        id: server.id.toString(),
        name: server.name
      }
    })
  })
})
