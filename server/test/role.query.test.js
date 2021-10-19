const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')

describe('Query role', () => {
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
        query: `query role {
          role(id: "1") {
            id
            name
            parent
            resources {
              id
              name
              permissions {
                id
                name
                allowed
              }
            }
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
        query: `query role {
          role(id: "1") {
            id
            name
            parent
            resources {
              id
              name
              permissions {
                id
                name
                allowed
              }
            }
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
    const account = await getAccount(request, cookie)
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'view.own')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query role {
          role(id: "1") {
            id
            name
            parent
            resources {
              id
              name
              permissions {
                id
                name
                allowed
              }
            }
          }
        }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.role.id, '1')
    assert.strictEqual(body.data.role.name, 'Guest')
    assert.strictEqual(body.data.role.parent, null)

    assert.strictEqual(body.data.role.resources.length, 12)

    const [serverResource] = body.data.role.resources.filter((resource) => resource.name === 'servers')

    assert.deepStrictEqual(serverResource, {
      id: '1',
      name: 'servers',
      permissions: [
        {
          allowed: true,
          id: '1',
          name: 'view'
        },
        {
          allowed: false,
          id: '2',
          name: 'manage'
        }
      ]
    })
  })
})
