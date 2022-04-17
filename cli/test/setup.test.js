const nixt = require('nixt')
const { unparse } = require('uuid-parse')
const { tables } = require('../../server/data/tables')
const { createSetup } = require('../../server/test/lib')
const { createPlayer } = require('../../server/test/fixtures')

describe('setup', () => {
  let setup
  let playerId

  beforeAll(async () => {
    setup = await createSetup()

    await setup.dbPool.raw('DELETE FROM bm_web_servers')
    await setup.dbPool.raw('TRUNCATE bm_web_player_roles')
    await setup.dbPool.raw('TRUNCATE bm_web_users')

    const player = createPlayer()

    await setup.dbPool('bm_players').insert(player)

    playerId = unparse(player.id)
  }, 20000)

  afterAll(async () => {
    await setup.teardown()
  }, 20000)

  test('should disallow invalid email address', done => {
    nixt()
      .env('SERVER_FOOTER_NAME', 'test')
      .env('CONTACT_EMAIL', '')
      .run('./bin/run setup')
      .on(/Email address for push notification/).respond('test\n')
      .stdout(/Email address is not valid. Please try again/)
      .end(done)
  })

  test('should disallow invalid server footer name', done => {
    nixt()
      .env('SERVER_FOOTER_NAME', '')
      .run('./bin/run setup')
      .on(/Server name \(displayed in footer of website\)/).respond('#123456789_+aaaaaaaaaaaaaaaaaaaaa\n')
      .stdout(/Invalid name, only letters, numbers and a maximum of 32 characters allowed/)
      .end(done)
  })

  test('should output env', done => {
    const dbPool = setup.dbPool.client.config.connection
    const cmd = nixt()
      .env('SERVER_FOOTER_NAME', '')
      .env('CONTACT_EMAIL', '')
      .env('ENCRYPTION_KEY', '')
      .env('SESSION_KEY', '')
      .env('NOTIFICATION_VAPID_PUBLIC_KEY', '')
      .env('NOTIFICATION_VAPID_PRIVATE_KEY', '')
      .env('DB_HOST', '')
      .env('DB_PORT', '')
      .env('DB_USER', '')
      .env('DB_PASSWORD', '')
      .env('DB_NAME', '')
      .run('./bin/run setup --writeFile env')
      .on(/Server name \(displayed in footer of website\)/).respond('BanManagement\n')
      .on(/Email address for push notification/).respond('test@banmanagement.com\n')
      .on(/Database Host/).respond(`${dbPool.host}\n`)
      .on(/Database Port/).respond(`${dbPool.port}\n`)
      .on(/Database User/).respond(`${dbPool.user}\n`)
      .on(/Database Password/).respond(`${dbPool.password || ''}\n`)
      .on(/Database Name/).respond(`${dbPool.database}\n`)
      .stdout(/Attempting to connect to database/)
      .stdout(/Connected to/)
      .stdout(/Setting up database/)
      .stdout(/Done/)
      .stdout(/Add a BanManager Server/)
      .on(/Server Database Host/).respond(`${dbPool.host}\n`)
      .on(/Server Database Port/).respond(`${dbPool.port}\n`)
      .on(/Server Database User/).respond(`${dbPool.user}\n`)
      .on(/Server Database Password/).respond(`${dbPool.password || ''}\n`)
      .on(/Server Database Name/).respond(`${dbPool.database}\n`)
      .stdout(/Attempting to connect to database/)
      .on(/Server Name/).respond('Test\n')
      .stdout(/Please enter table names from config.yml/)

    for (const [key, value] of Object.entries(tables)) {
      cmd.on(new RegExp(`${key} table name`)).respond(`${value}\n`)
    }

    cmd
      .on(/Console UUID/).respond(`${playerId}\n`)
      .stdout(/Found player/)
      .stdout(/Saving server Test/)
      .stdout(/Setup your admin user/)
      .on(/Your email address/).respond('admin@banmanagement.com\n')
      .on(/Your Password/).respond('testingstuff\n')
      .on(/Confirm Password/).respond('testingstuff\n')
      .on(/Your Minecraft Player UUID/).respond(`${playerId}\n`)
      .stdout(/Found player/)
      .stdout(/Cleaning up/)
      .stdout(/Setup complete, environment variables are/)
      .stdout(/Written env to disk/)
      .unlink('env')
      .end(done)
  }, 30000)
})
