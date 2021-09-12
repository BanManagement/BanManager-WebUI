const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const { jsonToGraphQLQuery } = require('json-to-graphql-query')
const { decrypt } = require('../data/crypto')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer, createServer } = require('./fixtures')

describe('Mutation create server', () => {
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

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        createServer:
          {
            __args: {
              input: server
            },
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

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        createServer:
          {
            __args: {
              input: server
            },
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

  test('should error if tables missing', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const server = await createServer(unparse(player.id), setup.dbPool.client.config.connection.database)

    delete server.id
    server.tables = JSON.parse(server.tables)
    server.tables.players = 'doesNotExist'

    const query = jsonToGraphQLQuery({
      mutation: {
        createServer:
          {
            __args: {
              input: server
            },
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
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const server = await createServer(unparse(player.id), setup.dbPool.client.config.connection.database)

    delete server.id
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        createServer:
          {
            __args: {
              input: server
            },
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

  test('should error server name exists', async () => {
    const { config } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()
    const server = await createServer(unparse(player.id), setup.dbPool.client.config.connection.database)

    delete server.id
    server.tables = JSON.parse(server.tables)
    server.name = config.name

    const query = jsonToGraphQLQuery({
      mutation: {
        createServer:
          {
            __args: {
              input: server
            },
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
    const { pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()

    await pool('bm_players').insert(player)

    // Create temp user
    await pool.raw('CREATE USER \'foobarcreate\'@\'localhost\' IDENTIFIED BY \'password\';')
    await pool.raw('GRANT ALL ON *.* TO \'foobarcreate\'@\'localhost\';')
    await pool.raw('FLUSH PRIVILEGES;')
    const server = await createServer(unparse(player.id), setup.dbPool.client.config.connection.database)

    delete server.id
    server.user = 'foobarcreate'
    server.password = 'password'
    server.tables = JSON.parse(server.tables)

    const query = jsonToGraphQLQuery({
      mutation: {
        createServer:
          {
            __args: {
              input: server
            },
            id: true
          }
      }
    })
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query })

    // Delete custom user
    await pool('mysql.user').where('user', 'foobarcreate').del()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data.createServer.id)

    const result = await pool('bm_web_servers').where('id', body.data.createServer.id).first()
    const decrypted = await decrypt(process.env.ENCRYPTION_KEY, result.password)

    assert.strictEqual(decrypted, 'password')
  })
})
