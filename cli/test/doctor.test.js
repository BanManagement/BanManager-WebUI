const nixt = require('nixt')
const { hash } = require('../../server/data/hash')
const { encrypt } = require('../../server/data/crypto')
const { createFreshSetup } = require('../../server/test/lib')
const { createPlayer, createServer } = require('../../server/test/fixtures')

const ADMIN_ROLE_ID = 3
const ENCRYPTION_KEY = 'b097b390a68441cc3bb151dd0171f25c3aabc688c50eeb26dc5e13254b333911'
const SESSION_KEY = 'a73545a5f08d2906e39a4438014200303f9269f3ade9227525ffb141294f1b62'

describe('doctor', () => {
  test('reports environment problems and exits non-zero when nothing is configured', done => {
    nixt()
      .env('ENCRYPTION_KEY', '')
      .env('SESSION_KEY', '')
      .env('DB_HOST', '')
      .env('DB_PORT', '')
      .env('DB_USER', '')
      .env('DB_PASSWORD', '')
      .env('DB_NAME', '')
      .env('CONTACT_EMAIL', '')
      .env('NOTIFICATION_VAPID_PUBLIC_KEY', '')
      .env('NOTIFICATION_VAPID_PRIVATE_KEY', '')
      .env('DOTENV_CONFIG_PATH', '/this/path/does/not/exist')
      .run('./bin/run.js doctor')
      .stdout(/environment variables/i)
      .stdout(/database connection/i)
      .stdout(/SKIP|WARN/)
      .stdout(/Doctor finished:/)
      .end(done)
  }, 20000)

  test('with --url for a non-existent server, marks http /health as FAIL', done => {
    nixt()
      .env('ENCRYPTION_KEY', '')
      .env('SESSION_KEY', '')
      .env('DB_HOST', '')
      .env('DOTENV_CONFIG_PATH', '/this/path/does/not/exist')
      .run('./bin/run.js doctor --url=http://127.0.0.1:1/health')
      .stdout(/http \/health/)
      .stdout(/FAIL|Could not reach/)
      .end(done)
  }, 20000)

  describe('against a fully-seeded installation (positive path)', () => {
    let setup
    let player

    beforeAll(async () => {
      setup = await createFreshSetup({ namespace: 'bm_doctor_test' })

      player = createPlayer()
      await setup.dbPool('bm_players').insert(player)
      await setup.dbPool('bm_web_users').insert({
        email: 'admin@example.com',
        password: await hash('longenough'),
        player_id: player.id,
        updated: Math.floor(Date.now() / 1000)
      })
      await setup.dbPool('bm_web_player_roles').insert({ player_id: player.id, role_id: ADMIN_ROLE_ID })

      const server = await createServer(player.id, setup.dbConfig.database)
      // Mirror what /api/setup/finalize does: store the BanManager server password
      // encrypted at rest, so doctor must decrypt it before re-connecting.
      if (server.password) {
        server.password = await encrypt(ENCRYPTION_KEY, server.password)
      }
      await setup.dbPool('bm_web_servers').insert(server)
    }, 60000)

    afterAll(async () => {
      if (setup) await setup.teardown()
    }, 20000)

    test('reports PASS for env, db connection, migrations, admin user and banmanager server', done => {
      nixt()
        .env('ENCRYPTION_KEY', ENCRYPTION_KEY)
        .env('SESSION_KEY', SESSION_KEY)
        .env('DB_HOST', setup.dbConfig.host || '127.0.0.1')
        .env('DB_PORT', String(setup.dbConfig.port || 3306))
        .env('DB_USER', setup.dbConfig.user)
        .env('DB_PASSWORD', setup.dbConfig.password || '')
        .env('DB_NAME', setup.dbConfig.database)
        .env('CONTACT_EMAIL', 'admin@example.com')
        .env('NOTIFICATION_VAPID_PUBLIC_KEY', 'placeholder-public-key')
        .env('NOTIFICATION_VAPID_PRIVATE_KEY', 'placeholder-private-key')
        .env('DOTENV_CONFIG_PATH', '/this/path/does/not/exist')
        .run('./bin/run.js doctor')
        .stdout(/\[.*PASS.*\] database connection/)
        .stdout(/\[.*PASS.*\] migrations/)
        .stdout(/\[.*PASS.*\] admin user/)
        .stdout(/\[.*PASS.*\] banmanager server/)
        .stdout(/Doctor finished:.*pass/)
        .end(done)
    }, 30000)
  })
})
