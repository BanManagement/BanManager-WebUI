const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('/api/logout', () => {
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

  test('should not error if not logged in', async () => {
    const { statusCode } = await request
      .post('/api/logout')
      .set('Accept', 'application/json')

    assert.strictEqual(statusCode, 204)
  })

  test('should logout', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { statusCode } = await request
      .post('/api/logout')
      .set('Cookie', cookie)
      .expect('Set-Cookie', /bm-webui-sess/)
      .set('Accept', 'application/json')

    assert.strictEqual(statusCode, 204)
  })
})
