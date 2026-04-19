const assert = require('assert')
const supertest = require('supertest')
const MockDate = require('mockdate')
const nock = require('nock')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

const parseSessionUpdated = (cookieHeader) => {
  const sessPart = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('bm-webui-sess='))
  if (!sessPart) throw new Error('bm-webui-sess cookie not found')
  const value = sessPart.slice('bm-webui-sess='.length)
  const decoded = JSON.parse(Buffer.from(value, 'base64').toString('utf8'))
  return decoded.updated
}

describe('Mutation set password', () => {
  let setup
  let request

  beforeAll(async () => {
    nock.cleanAll()

    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 20000)

  afterAll(async () => {
    nock.cleanAll()
    nock.restore()
    MockDate.reset()

    await setup.teardown()
  })

  test('should error if unauthenticated', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation setPassword {
        setPassword(newPassword: "testing") {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'You are not logged in')
    assert.strictEqual(body.errors[0].extensions.appCode, 'NOT_LOGGED_IN')
  })

  test('should error if current password not provided', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setPassword {
          setPassword(newPassword: "test") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Invalid password, minimum length 6 characters')
  })

  test('should error if current password not correct', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setPassword {
          setPassword(currentPassword: "notCorrect", newPassword: "testing") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Incorrect login details')
  })

  test('should error if new password too short', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setPassword {
          setPassword(currentPassword: "notCorrect", newPassword: "test") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Invalid password, minimum length 6 characters')
  })

  test('should error if new password is too common', async () => {
    nock('https://api.pwnedpasswords.com')
      .get('/range/8843D')
      .query(true)
      .reply(200, '7F92416211DE9EBB963FF4CE28125932878:11063')

    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setPassword {
          setPassword(currentPassword: "testing", newPassword: "foobar") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)
    assert(nock.isDone())

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'This password isn\'t safe to use as it\'s appeared in 11,063 known data breaches')
  })

  test('should update password and invalidate all other sessions', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    // Mock relative to the cookie's session.updated (which mirrors the seeded
    // user.updated timestamp) instead of real wall-clock time. The previous
    // `Date.now() - 5000` flaked when total test runtime crossed the 5s window:
    // mockedTime would land at >= T_seed, so the resolver's
    // `session.updated = Math.floor(Date.now() / 1000)` produced no change, no
    // koa-session commit, and no `set-cookie` header in the response.
    const sessUpdated = parseSessionUpdated(cookie)
    MockDate.set(new Date((sessUpdated - 5) * 1000))
    let oldCookie = await getAuthPassword(request, 'admin@banmanagement.com')

    assert.notStrictEqual(cookie, oldCookie)

    nock('https://api.pwnedpasswords.com')
      .get('/range/8843D')
      .query(true)
      .reply(200, '7F92416211DE9EBB963FF4CE28125932878:1')

    const { header, body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setPassword {
          setPassword(currentPassword: "testing", newPassword: "foobar") {
            id
          }
      }`
      })

    assert(nock.isDone())
    assert.strictEqual(statusCode, 200)
    assert(body)

    MockDate.reset()

    oldCookie = header['set-cookie'].join(';')

    // Confirm other session invalid
    const { body: body2, statusCode: statusCode2 } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query me {
          me {
            id
          }
      }`
      })

    assert.strictEqual(statusCode2, 200)

    assert(body2)

    assert.strictEqual(body2.data.me.id, null)

    // Confirm current session still valid
    const { body: body3, statusCode: statusCode3 } = await request
      .post('/graphql')
      .set('Cookie', oldCookie)
      .set('Accept', 'application/json')
      .send({
        query: `query me {
          me {
            id
          }
      }`
      })

    assert.strictEqual(statusCode3, 200)

    assert(body3)
    assert(body3.data)
    assert(body3.data.me.id)
  })
})
