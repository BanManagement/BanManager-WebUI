const supertest = require('supertest')
const createApp = require('../app')
const { SETUP_STATES } = require('../setup/state')

const ORIGINAL_BASE_PATH = process.env.BASE_PATH

describe('setup-mode boot under BASE_PATH', () => {
  let request
  let server

  beforeAll(async () => {
    process.env.BASE_PATH = '/admin'
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
    if (ORIGINAL_BASE_PATH === undefined) {
      delete process.env.BASE_PATH
    } else {
      process.env.BASE_PATH = ORIGINAL_BASE_PATH
    }
  })

  test('GET /admin/setup serves the installer (no redirect loop)', async () => {
    const res = await request.get('/admin/setup').redirects(0)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/html/)
    expect(res.text).toMatch(/BanManager WebUI/i)
  })

  test('GET /admin/setup/app.js serves installer JavaScript', async () => {
    const res = await request.get('/admin/setup/app.js')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/javascript/)
  })

  test('GET /admin/api/setup/state responds without redirecting', async () => {
    const res = await request.get('/admin/api/setup/state').redirects(0)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('setup_required')
  })

  test('GET /health is allowed at the root (not under basePath)', async () => {
    const res = await request.get('/health').redirects(0)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('setup_required')
  })

  test('GET /admin (basePath root) redirects to /admin/setup', async () => {
    const res = await request.get('/admin').redirects(0)

    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/admin/setup')
  })

  test('GET /admin/dashboard (unrelated path under basePath) redirects to /admin/setup once and serves it on the second hop', async () => {
    const first = await request.get('/admin/dashboard').redirects(0)
    expect(first.status).toBe(302)
    expect(first.headers.location).toBe('/admin/setup')

    const followed = await request.get(first.headers.location).redirects(0)
    expect(followed.status).toBe(200)
    expect(followed.headers['content-type']).toMatch(/text\/html/)
  })
})
