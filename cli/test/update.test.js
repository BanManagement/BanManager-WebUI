const nixt = require('nixt')
const { createSetup } = require('../../server/test/lib')

describe('update', () => {
  let setup

  beforeAll(async () => {
    setup = await createSetup()
  }, 20000)

  afterAll(async () => {
    await setup.teardown()
  }, 20000)

  test('should update schema', async done => {
    const dbPool = setup.dbPool.pool.config.connectionConfig

    nixt()
      .env('DB_HOST', dbPool.host)
      .env('DB_PORT', dbPool.port)
      .env('DB_USER', dbPool.user)
      .env('DB_PASSWORD', dbPool.password)
      .env('DB_NAME', dbPool.database)
      .run('./bin/run update')
      .stdout(/Done/)
      .end(done)
  })
})
