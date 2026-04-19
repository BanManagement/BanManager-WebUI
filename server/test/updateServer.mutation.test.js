const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const { jsonToGraphQLQuery } = require('json-to-graphql-query')
const { decrypt } = require('../data/crypto')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer, createServer } = require('./fixtures')

describe('Mutation update server', () => {
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

  test('should error if unauthenticated', async () => {
    const player = createPlayer()
    const server = await createServer(unparse(player.id), 'test')
    const serverId = server.id

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should require servers.manage', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const player = createPlayer()
    const server = await createServer(unparse(player.id), 'test')
    const serverId = server.id

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should error if server does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const server = await createServer(unparse(player.id), setup.dbPool.client.config.connection.database)
    const serverId = server.id

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Server not found')
  })

  test('should error if tables missing', async () => {
    const { config } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const server = await createServer(unparse(player.id), setup.dbPool.client.config.connection.database)
    const serverId = config.id

    delete server.id
    server.tables = JSON.parse(server.tables)
    server.tables.players = 'doesNotExist'

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Tables do not exist in the database: players')
  })

  test('should error if console does not exist', async () => {
    const { config } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const server = await createServer(unparse(player.id), setup.dbPool.client.config.connection.database)
    const serverId = config.id

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Console UUID not found in bm_players table')
  })

  test('should error if name already exists', async () => {
    const { config } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const server = await createServer(player.id, setup.dbPool.client.config.connection.database)
    const serverId = config.id

    await setup.dbPool('bm_web_servers').insert(server)

    delete server.id
    server.console = unparse(server.console)
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'A server with this name already exists')
  })

  test('should encrypt password', async () => {
    const { config, pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()

    await pool('bm_players').insert(player)

    // Create temp user (use % to allow connections from any host, needed for Docker)
    await pool.raw('DROP USER IF EXISTS \'foobarupdate\'@\'%\';')
    await pool.raw('CREATE USER \'foobarupdate\'@\'%\' IDENTIFIED BY \'password\';')
    await pool.raw('GRANT ALL ON *.* TO \'foobarupdate\'@\'%\';')
    await pool.raw('FLUSH PRIVILEGES;')
    const server = await createServer(unparse(player.id), setup.dbPool.client.config.connection.database)
    const serverId = config.id

    delete server.id

    server.user = 'foobarupdate'
    server.password = 'password'
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input: server },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    // updateServer rebuilds the server pool when connection details change,
    // so the original `pool` reference has been destroyed by this point.
    // Use the admin-credentialed setup pool for cleanup + verification —
    // it points at the same MySQL server in tests.
    await setup.dbPool.raw('DROP USER IF EXISTS \'foobarupdate\'@\'%\';')

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data.updateServer.id)

    const result = await setup.dbPool('bm_web_servers').select('*').where('id', body.data.updateServer.id).first()
    const decrypted = await decrypt(process.env.ENCRYPTION_KEY, result.password)

    assert.strictEqual(decrypted, 'password')
  })

  test('should refresh the in-memory serversPool entry so subsequent reads see the new name', async () => {
    const { config } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const serverId = config.id
    const newName = `Renamed-${Date.now().toString(36).slice(-6)}`
    // The previous test left the server pointing at the now-deleted
    // `foobarupdate` MySQL user, so reuse the original setup DB credentials
    // (admin) for the connection check rather than whatever happens to be in
    // the cached config — otherwise updateServer's pre-flight createConnection
    // call would fail before it ever touched the serversPool refresh logic.
    const input = {
      name: newName,
      host: setup.dbConfig.host,
      port: Number.parseInt(setup.dbConfig.port, 10),
      database: config.database,
      user: setup.dbConfig.user,
      password: setup.dbConfig.password,
      console: unparse(config.console),
      tables: config.tables
    }

    const query = jsonToGraphQLQuery({
      mutation: {
        updateServer:
          {
            __args: { id: serverId, input },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    assert.strictEqual(statusCode, 200)
    assert.strictEqual(body.errors, undefined)
    assert.strictEqual(body.data.updateServer.id, serverId)

    // The serversPool cache must reflect the new name immediately, otherwise
    // the /admin/servers list (and every per-server scoped resolver) keeps
    // serving the old name until the 3-second background sync catches up.
    const refreshed = setup.serversPool.get(serverId)

    assert(refreshed, 'updateServer must keep the serversPool entry')
    assert.strictEqual(refreshed.config.name, newName)
    assert.strictEqual(refreshed.config.id, serverId)
  })
})
