// In normal-mode (i.e. once the WebUI database has an admin role + a server
// row), the setup router must refuse to serve the installer or accept any
// /api/setup/* mutation — otherwise an attacker who reached /setup could rerun
// the wizard and replace the admin/keys.
//
// We cover this here in jest rather than relying on the e2e installer spec to
// catch a regression: the e2e supervisor's setup-mode -> normal-mode restart
// is slow and racy, so verifying the lockdown deterministically via supertest
// is much more reliable.

const supertest = require('supertest')
const createApp = require('../app')
const { createSetup } = require('./lib')

describe('setup router lockdown after setup is complete', () => {
  let setup
  let request

  beforeAll(async () => {
    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 30000)

  afterAll(async () => {
    if (setup) await setup.teardown()
  }, 20000)

  test('GET /setup returns 404 with a "Setup is already complete" error', async () => {
    const res = await request.get('/setup')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Setup is already complete' })
  })

  test('GET /setup/app.js is also blocked', async () => {
    const res = await request.get('/setup/app.js')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Setup is already complete' })
  })

  test('POST /api/setup/finalize is rejected with 404 instead of overwriting state', async () => {
    const res = await request
      .post('/api/setup/finalize')
      .send({ db: {}, server: {}, admin: {} })

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Setup is already complete' })
  })

  test('POST /api/setup/admin/preflight is also rejected', async () => {
    const res = await request
      .post('/api/setup/admin/preflight')
      .send({
        email: 'attacker@example.com',
        password: 'longenough',
        playerUuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      })

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Setup is already complete' })
  })

  test('GET /api/setup/state is the one exception — it must keep working so callers can detect the normal-mode flip', async () => {
    const res = await request.get('/api/setup/state')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'normal' })
  })
})
