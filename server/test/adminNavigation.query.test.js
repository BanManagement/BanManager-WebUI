const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Query adminNavigation', () => {
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
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query adminNavigation {
        adminNavigation {
          left {
            id
            name
            label
            href
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)

    assert.deepStrictEqual(body.data.adminNavigation.left, [
      { id: '1', name: 'Roles', label: 3, href: '/admin/roles' },
      { id: '2', name: 'Servers', label: 1, href: '/admin/servers' }
    ])
  })
})
