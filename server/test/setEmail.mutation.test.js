const assert = require('assert')
const supertest = require('supertest')
const MockDate = require('mockdate')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')

describe('Mutation set email', () => {
  let setup
  let request

  beforeAll(async () => {
    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 20000)

  afterAll(async () => {
    MockDate.reset()

    await setup.teardown()
  })

  test('should error if unauthenticated', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation setEmail {
        setEmail(currentPassword: "test", email: "test") {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should error if current password not correct', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setEmail {
          setEmail(currentPassword: "notCorrect", email: "testing@test.com") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Incorrect login details')
  })

  test('should error if email invalid', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setEmail {
          setEmail(currentPassword: "notCorrect", email: "testing.com") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Invalid email address')
  })

  test('should error if password too short', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setEmail {
          setEmail(currentPassword: "test", email: "test") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Invalid password, minimum length 6 characters')
  })

  test('should error if email already used', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setEmail {
          setEmail(currentPassword: "testing", email: "admin@banmanagement.com") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'You already have an account')
  })

  test('should update email', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation setEmail {
          setEmail(currentPassword: "testing", email: "test@test.com") {
            id
          }
      }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body)

    const { body: body2, statusCode: statusCode2 } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query me {
          me {
            id
            email
          }
      }`
      })

    assert.strictEqual(statusCode2, 200)

    assert(body2)
    assert.strictEqual(body2.data.me.email, 'test@test.com')

    // Confirm old email address does not allow logins
    let errorThrown = false

    try {
      await getAuthPassword(request, 'admin@banmanagement.com')
    } catch (e) {
      assert.strictEqual(e.actual, 400)
      errorThrown = true
    } finally {
      assert(errorThrown)
    }
  })
})
