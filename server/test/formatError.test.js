const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('GraphQL formatError', () => {
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

  test('should expose appCode for ExposedError thrown by resolver', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setLocale {
        setLocale(locale: "xx") {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body.errors)

    const error = body.errors[0]

    assert.strictEqual(error.extensions.code, 'ERR_EXPOSED')
    assert.strictEqual(error.extensions.appCode, 'INVALID_LOCALE')
  })

  test('should expose NOT_LOGGED_IN appCode when @allowIfLoggedIn rejects', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation setLocale {
        setLocale(locale: "de") {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body.errors)

    const error = body.errors[0]

    assert.strictEqual(error.extensions.code, 'ERR_EXPOSED')
    assert.strictEqual(error.extensions.appCode, 'NOT_LOGGED_IN')
    assert.strictEqual(error.message, 'You are not logged in')
  })

  test('should expose meta when ExposedError carries meta', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setLocale {
        setLocale(locale: "fr") {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body.errors)

    const error = body.errors[0]

    assert.strictEqual(error.extensions.code, 'ERR_EXPOSED')
    assert.strictEqual(error.extensions.appCode, 'INVALID_LOCALE')
  })
})

describe('GraphQL formatError (unit)', () => {
  let formatError

  beforeAll(() => {
    const config = require('../graphql/schema')({ logger: { error () {} } })
    formatError = config.formatError
  })

  test('preserves explicit appCode on ExposedError', () => {
    const original = new Error('boom')
    original.extensions = { code: 'ERR_EXPOSED', appCode: 'CUSTOM_CODE', meta: { foo: 1 } }

    const result = formatError({ originalError: original, message: 'boom' })

    assert.deepStrictEqual(result, {
      message: 'boom',
      extensions: { code: 'ERR_EXPOSED', appCode: 'CUSTOM_CODE', meta: { foo: 1 } }
    })
  })

  test('defaults appCode to UNKNOWN when ExposedError omits it', () => {
    const original = new Error('boom')
    original.extensions = { code: 'ERR_EXPOSED' }

    const result = formatError({ originalError: original, message: 'boom' })

    assert.strictEqual(result.extensions.appCode, 'UNKNOWN')
  })

  test('passes BAD_USER_INPUT through without overriding the original message', () => {
    const original = new Error('Must be at most 20 characters')
    original.extensions = { code: 'BAD_USER_INPUT' }

    const result = formatError({ originalError: original, message: 'Must be at most 20 characters' })

    assert.strictEqual(result.message, 'Must be at most 20 characters')
    assert.strictEqual(result.extensions.code, 'BAD_USER_INPUT')
    assert.strictEqual(result.extensions.appCode, undefined,
      'BAD_USER_INPUT should NOT carry an appCode so the constraint message is shown verbatim')
  })

  test('maps unknown errors to INTERNAL_SERVER_ERROR / INTERNAL', () => {
    const original = new Error('kaboom')

    const result = formatError({ originalError: original, message: 'kaboom' })

    assert.strictEqual(result.message, 'Internal Server Error')
    assert.strictEqual(result.extensions.code, 'INTERNAL_SERVER_ERROR')
    assert.strictEqual(result.extensions.appCode, 'INTERNAL')
  })
})
