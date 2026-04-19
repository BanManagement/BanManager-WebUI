const supertest = require('supertest')
const createApp = require('../app')
const { SETUP_STATES } = require('../setup/state')

describe('setup-mode boot', () => {
  let request
  let server

  beforeAll(async () => {
    const app = await createApp({
      dbPool: null,
      logger: null,
      serversPool: null,
      disableUI: true,
      setupMode: true,
      setupState: SETUP_STATES.SETUP_NO_KEYS
    })

    server = app.listen()
    request = supertest(server)
  })

  afterAll(() => {
    if (server && server.close) server.close()
  })

  test('GET /health returns setup_required with the setup state as the reason', async () => {
    const res = await request.get('/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('setup_required')
    expect(res.body.reason).toBe(SETUP_STATES.SETUP_NO_KEYS)
    expect(typeof res.body.version).toBe('string')
  })

  test('GET /api/setup/state reports setup_required when no dbPool is wired', async () => {
    const res = await request.get('/api/setup/state')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('setup_required')
  })

  test('GET /setup serves the web installer HTML page', async () => {
    const res = await request.get('/setup')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/html/)
    expect(res.text).toMatch(/BanManager WebUI/i)
  })

  test('GET /setup/app.js serves the installer JavaScript', async () => {
    const res = await request.get('/setup/app.js')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/javascript/)
    expect(res.text.length).toBeGreaterThan(100)
  })

  test('GET / redirects to /setup', async () => {
    const res = await request.get('/').redirects(0)

    expect(res.status).toBe(302)
    expect(res.headers.location).toMatch(/\/setup$/)
  })

  test('POST /api/setup/admin/preflight rejects invalid input', async () => {
    const res = await request
      .post('/api/setup/admin/preflight')
      .send({ email: 'not-an-email', password: '123', playerUuid: 'nope' })

    expect(res.status).toBe(400)
    expect(typeof res.body.error).toBe('string')
    expect(res.body.error).toMatch(/email|password|UUID/i)
  })

  test('POST /api/setup/admin/preflight accepts valid input', async () => {
    const res = await request
      .post('/api/setup/admin/preflight')
      .send({
        email: 'admin@example.com',
        password: 'longenough',
        playerUuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

describe('setup-mode boot with SETUP_TOKEN', () => {
  let request
  let server
  const ORIGINAL_TOKEN = process.env.SETUP_TOKEN
  const TOKEN = 'test-setup-token-do-not-leak'

  beforeAll(async () => {
    process.env.SETUP_TOKEN = TOKEN
    const app = await createApp({
      dbPool: null,
      logger: null,
      serversPool: null,
      disableUI: true,
      setupMode: true,
      setupState: SETUP_STATES.SETUP_NO_KEYS
    })

    server = app.listen()
    request = supertest(server)
  })

  afterAll(() => {
    if (server && server.close) server.close()
    if (ORIGINAL_TOKEN === undefined) delete process.env.SETUP_TOKEN
    else process.env.SETUP_TOKEN = ORIGINAL_TOKEN
  })

  test('preflight reports token_required without leaking the token value', async () => {
    const res = await request.get('/api/setup/preflight')

    expect(res.status).toBe(200)
    expect(res.body.requireToken).toBe(true)
    expect(res.body.state).toBe('token_required')
    expect(JSON.stringify(res.body)).not.toContain(TOKEN)
  })

  test('POST /api/setup/admin/preflight is rejected without a token', async () => {
    const res = await request
      .post('/api/setup/admin/preflight')
      .send({ email: 'admin@example.com', password: 'longenough', playerUuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/token/i)
  })

  test('POST /api/setup/token rejects an incorrect token', async () => {
    const res = await request
      .post('/api/setup/token')
      .send({ token: 'wrong' })

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/invalid/i)
  })

  test('POST /api/setup/token accepts the correct token', async () => {
    const res = await request
      .post('/api/setup/token')
      .send({ token: TOKEN })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  test('subsequent setup mutations succeed when the token header is included', async () => {
    const res = await request
      .post('/api/setup/admin/preflight')
      .set('X-Setup-Token', TOKEN)
      .send({ email: 'admin@example.com', password: 'longenough', playerUuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
