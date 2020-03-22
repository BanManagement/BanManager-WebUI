const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Query me', () => {
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
        query: `query me {
        me {
          id
          name
          hasAccount
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert(body.data.me.id)
    assert(body.data.me.name)
    assert(body.data.me.hasAccount)
  })

  test('should error if not logged in', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query me {
        me {
          id
          name
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)

    assert.strictEqual(body.data.me, null)
    assert.strictEqual(body.errors[0].message, 'Invalid session')
  })
})
