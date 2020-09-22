const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup } = require('./lib')
const { createPlayer } = require('./fixtures')
const { hash } = require('../data/hash')

describe('/api/session', () => {
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

  describe('Password', () => {
    test('should error if invalid email type', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ email: 123, password: 'test' })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid email type')
    })

    test('should error if invalid email address', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ email: 'asd', password: 'test' })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid email address')
    })

    test('should error if email address too long', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
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
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ email: 'asd@asd.com', password: 123 })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid password type')
    })

    test('should error if password too short', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ email: 'asd@asd.com', password: 'aaaaa' })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid password, minimum length 6 characters')
    })

    test('should error if password too long', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
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

    test('should error if email address not found', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ email: 'asd@asd.com', password: 'testing' })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Incorrect login details')
    })

    test('should error if password does not match', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ email: 'admin@banmanagement.com', password: 'testiasd' })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Incorrect login details')
    })

    test('should set a cookie on success', async () => {
      const { statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .expect('Set-Cookie', /bm-webui-sess/)
        .send({ email: 'admin@banmanagement.com', password: 'testing' })

      assert.strictEqual(statusCode, 204)
    })
  })

  describe('Pin', () => {
    test('should error if invalid name', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ name: 1 })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid name')
    })

    test('should error if invalid name', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ name: '#yar' })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid name')
    })

    test('should error if name too long', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ name: 'testinglotsofthings' })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid name')
    })

    test('should error if invalid pin', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ name: 'confuser', pin: 123 })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid pin type')
    })

    test('should error if pin too short', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ name: 'confuser', pin: '1234' })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid pin, must be 6 characters')
    })

    test('should error if pin too long', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ name: 'confuser', pin: '123456789' })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Invalid pin, must be 6 characters')
    })

    test('should error if server not found', async () => {
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ name: 'confuser', pin: '123456', serverId: 'a' })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Server does not exist')
    })

    test('should error if name not found', async () => {
      const { config: server } = setup.serversPool.values().next().value
      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ name: 'yargasd', pin: '123456', serverId: server.id })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Incorrect login details')
    })

    test('should error if pin does not match', async () => {
      const { config: server, pool } = setup.serversPool.values().next().value
      const player = createPlayer()

      await pool('bm_players').insert(player)
      await pool('bm_player_pins').insert({ player_id: player.id, pin: await hash('123456'), expires: 0 })

      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .send({ name: player.name, pin: '123459', serverId: server.id })

      assert.strictEqual(statusCode, 400)

      assert(body)
      assert.strictEqual(body.error, 'Incorrect login details')
    })

    test('should set a cookie on success', async () => {
      const { config: server, pool } = setup.serversPool.values().next().value
      const player = createPlayer()

      await pool('bm_players').insert(player)
      await pool('bm_player_pins').insert({ player_id: player.id, pin: await hash('123456'), expires: Math.floor(Date.now() / 1000) + 1000 })

      const { body, statusCode } = await request
        .post('/api/session')
        .set('Accept', 'application/json')
        .expect('Set-Cookie', /bm-webui-sess/)
        .send({ name: player.name, pin: '123456', serverId: server.id })

      assert.strictEqual(statusCode, 200)
      assert.strictEqual(body.hasAccount, false)
    })
  })
})
