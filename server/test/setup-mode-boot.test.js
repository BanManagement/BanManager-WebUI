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
