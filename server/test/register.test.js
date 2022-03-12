const assert = require('assert')
const supertest = require('supertest')
const nock = require('nock')
const { unparse } = require('uuid-parse')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAuthPin } = require('./lib')
const { createPlayer } = require('./fixtures')

describe('/api/register', () => {
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

    await setup.teardown()
  }, 20000)

  test('should error if not logged in', async () => {
    const { body, statusCode } = await request
      .post('/api/register')
      .set('Accept', 'application/json')
      .send({ email: 123, password: 'test' })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'You are not logged in')
  })

  test('should error if invalid email type', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/api/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 123, password: 'test' })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'Invalid email type')
  })

  test('should error if invalid email address', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/api/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'asd', password: 'test' })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'Invalid email address')
  })

  test('should error if email address too long', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/api/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        password: 'test',
        email: // eslint-disable-next-line
        'asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd@asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd.com'
      })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'Invalid email address')
  })

  test('should error if invalid password', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/api/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'asd@asd.com', password: 123 })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'Invalid password type')
  })

  test('should error if password too short', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/api/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'asd@asd.com', password: 'aaaaa' })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'Invalid password, minimum length 6 characters')
  })

  test('should error if password too long', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/api/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        email: 'asd@asd.com',
        password: // eslint-disable-next-line
        'asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd@asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd.com'
      })

    assert.strictEqual(statusCode, 400)

    assert(body)
    assert.strictEqual(body.error, 'Invalid password, minimum length 6 characters')
  })

  test('should error if password too common/insecure', async () => {
    nock('https://api.pwnedpasswords.com')
      .get('/range/8843D')
      .reply(200, '7F92416211DE9EBB963FF4CE28125932878:11603')

    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/api/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'asd@asd.com', password: 'foobar' })

    assert.strictEqual(statusCode, 400)

    assert(nock.isDone())
    assert(body)
    assert.strictEqual(body.error, 'Commonly used password, please choose another')
  })

  test('should error if player has an account', async () => {
    nock('https://api.pwnedpasswords.com')
      .get('/range/DDE9E')
      .reply(200, '')

    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/api/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'admin@banmanagement.com', password: 'testiasd' })

    assert.strictEqual(statusCode, 400)

    assert(nock.isDone())
    assert(body)
    assert.strictEqual(body.error, 'You already have an account')
  })

  test('should error if email address found', async () => {
    const server = setup.serversPool.values().next().value
    const player = createPlayer()

    await server.pool('bm_players').insert(player)

    nock('https://api.pwnedpasswords.com')
      .get('/range/DC724')
      .reply(200, '')

    const cookie = await getAuthPin(request, server, player)
    const { body, statusCode } = await request
      .post('/api/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'admin@banmanagement.com', password: 'testing' })

    assert.strictEqual(statusCode, 400)

    assert(nock.isDone())
    assert(body)
    assert.strictEqual(body.error, 'You already have an account')
  })

  test('should register an account', async () => {
    const server = setup.serversPool.values().next().value
    const player = createPlayer()

    await server.pool('bm_players').insert(player)

    nock('https://api.pwnedpasswords.com')
      .get('/range/DC724')
      .reply(200, '')

    const cookie = await getAuthPin(request, server, player)
    const { statusCode } = await request
      .post('/api/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'asd@asda123.com', password: 'testing' })

    assert(nock.isDone())
    assert.strictEqual(statusCode, 204)
  })

  test('should register an account when a player already has a custom role', async () => {
    const server = setup.serversPool.values().next().value
    const player = createPlayer()

    await server.pool('bm_players').insert(player)

    const adminCookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body: setRolesBody, statusCode: setRolesStatusCode } = await request
      .post('/graphql')
      .set('Cookie', adminCookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation assignRole {
        setRoles(player:"${unparse(player.id)}", input: { roles: [ { id: 3 } ], serverRoles: [] }) {
          roles {
            role {
              id
            }
          }
        }
      }`
      })

    assert.strictEqual(setRolesStatusCode, 200)

    assert(setRolesBody)
    assert(setRolesBody.data)

    assert.deepStrictEqual(setRolesBody.data.setRoles.roles, [{ role: { id: '3' } }])

    nock('https://api.pwnedpasswords.com')
      .get('/range/DC724')
      .reply(200, '')

    const cookie = await getAuthPin(request, server, player)
    const { statusCode } = await request
      .post('/api/register')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ email: 'asd1@asda123.com', password: 'testing' })

    assert(nock.isDone())
    assert.strictEqual(statusCode, 204)
  })
})
