const path = require('path')
const nixt = require('nixt')
const DBMigrate = require('db-migrate')
const { createSetup } = require('../../server/test/lib')

describe.skip('uninstall', () => {
  let setup

  beforeAll(async () => {
    setup = await createSetup()
  }, 20000)

  afterAll(async () => {
    await setup.teardown()
  }, 20000)

  test('should uninstall', async done => {
    // Undo test migrations first
    const dbPool = setup.dbPool.client.config.connection
    const dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      multipleStatements: true,
      database: dbPool.database
    }

    const dbmOpts = {
      config: { dev: { ...dbConfig, driver: 'mysql' } },
      cmdOptions: { 'migrations-dir': path.join(__dirname, '..', '..', 'server', 'test', 'migrations') }
    }
    const dbm = DBMigrate.getInstance(true, dbmOpts)

    await dbm.down()

    nixt()
      .env('DB_HOST', dbPool.host)
      .env('DB_PORT', dbPool.port)
      .env('DB_USER', dbPool.user)
      .env('DB_PASSWORD', dbPool.password)
      .env('DB_NAME', dbPool.database)
      .run('./bin/run uninstall')
      .on(/Confirm/).respond('y\n')
      .stdout(/Database rolled back/)
      .end(done)
  })
})
