const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const { jsonToGraphQLQuery } = require('json-to-graphql-query')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer, createServer } = require('./fixtures')
const { interval } = require('../connections/servers-pool')

describe('Mutation delete server', () => {
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
    const { id } = await createServer(unparse(player.id), 'test')

    const query = jsonToGraphQLQuery({
      mutation: {
        deleteServer:
          {
            __args: {
              id
            }
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
    const { id } = await createServer(unparse(player.id), 'test')

    const query = jsonToGraphQLQuery({
      mutation: {
        deleteServer:
          {
            __args: {
              id
            }
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
    const { id } = await createServer(unparse(player.id), 'test')

    const query = jsonToGraphQLQuery({
      mutation: {
        deleteServer:
          {
            __args: {
              id
            }
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
      'Server does not exist')
  })

  test('should not allow deleting the only server', async () => {
    const { config } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const query = jsonToGraphQLQuery({
      mutation: {
        deleteServer:
          {
            __args: {
              id: config.id
            }
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
      'Cannot delete only server, please add a new server and then delete the old one')
  })

  test('should delete server', async () => {
    const { pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const player = createPlayer()

    await pool('bm_players').insert(player)

    // Create temp user
    await pool.raw('CREATE USER \'foobardelete\'@\'%\' IDENTIFIED BY \'password\';')
    await pool.raw('GRANT ALL ON *.* TO \'foobardelete\'@\'%\';')
    await pool.raw('FLUSH PRIVILEGES;')
    const server = await createServer(unparse(player.id), setup.dbPool.client.config.connection.database)

    delete server.id
    server.user = 'foobardelete'
    server.password = 'password'
    server.tables = JSON.parse(server.tables)

    const createQuery = jsonToGraphQLQuery({
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
    const { body: createBody, statusCode: createStatusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({ query: createQuery })

    // Delete custom user
    await pool('mysql.user').where('user', 'foobardelete').del()
    await pool.raw('FLUSH PRIVILEGES;')

    assert.strictEqual(createStatusCode, 200)

    await interval({ ...setup, servers: setup.serversPool })

    const query = jsonToGraphQLQuery({
      mutation: {
        deleteServer:
          {
            __args: {
              id: createBody.data.createServer.id
            }
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
    assert.strictEqual(body.data.deleteServer, createBody.data.createServer.id)
  })
})
