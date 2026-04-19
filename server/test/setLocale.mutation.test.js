const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Mutation setLocale', () => {
  let setup
  let request

  beforeAll(async () => {
    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 20000)

  afterAll(async () => {
    await setup.teardown()
  })

  beforeEach(async () => {
    await setup.dbPool('bm_web_users').update({ locale: null })
  })

  test('should error if not logged in', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation setLocale {
        setLocale(locale: "de") {
          id
          locale
        }
      }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body)
    assert(body.errors)
    assert.strictEqual(body.errors[0].extensions.code, 'ERR_EXPOSED')
    assert.strictEqual(body.errors[0].extensions.appCode, 'NOT_LOGGED_IN')
    assert.strictEqual(body.errors[0].message, 'You are not logged in')
  })

  test('should error if locale unsupported', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setLocale {
        setLocale(locale: "xx") {
          id
          locale
        }
      }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body)
    assert(body.errors)
    assert.strictEqual(body.errors[0].message, 'Locale is not supported')
    assert.strictEqual(body.errors[0].extensions.code, 'ERR_EXPOSED')
    assert.strictEqual(body.errors[0].extensions.appCode, 'INVALID_LOCALE')
  })

  test('should accept supported locale and persist it', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setLocale {
        setLocale(locale: "de") {
          id
          locale
        }
      }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.setLocale.locale, 'de')

    const { body: meBody } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query me {
        me {
          id
          locale
        }
      }`
      })

    assert.strictEqual(meBody.data.me.locale, 'de')
  })

  test('should accept switching back to en after setting de', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const setDeMutation = 'mutation { setLocale(locale: "de") { id locale } }'
    const setEnMutation = 'mutation { setLocale(locale: "en") { id locale } }'

    const { body: deBody } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: setDeMutation })

    assert.strictEqual(deBody.data.setLocale.locale, 'de')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: setEnMutation })

    assert.strictEqual(statusCode, 200)
    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.setLocale.locale, 'en')
  })
})
