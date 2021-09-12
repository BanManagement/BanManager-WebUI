const assert = require('assert')
const { EOL } = require('os')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const tables = Object.keys(require('../data/tables').tables)
const { createSetup, getAuthPassword } = require('./lib')

describe('Query servers', () => {
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

  test('should resolve all fields', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server } = setup.serversPool.values().next().value
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query servers {
        servers {
          id
          name
          host
          port
          database
          user
          console {
            id
          }
          tables {
            ${tables.join(EOL)}
          }
          timeOffset
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.servers.length, 1)

    const serverData = body.data.servers[0]

    assert.strictEqual(serverData.id, server.id)
    assert.strictEqual(serverData.name, server.name)
    assert.strictEqual(serverData.host, process.env.DB_HOST || '127.0.0.1')
    assert.strictEqual(serverData.port, parseInt(process.env.DB_PORT, 10) || 3306)
    assert.strictEqual(serverData.database, server.database)
    assert.strictEqual(serverData.user, 'root')
    assert.strictEqual(serverData.console.id, unparse(server.console))
    assert.deepStrictEqual(serverData.tables, server.tables)
    assert.strictEqual(serverData.timeOffset, 0)
  })

  test('should error on protected fields', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query servers {
        servers {
          id
          name
          host
          port
          database
          user
          console {
            id
          }
          tables {
            ${tables.join(EOL)}
          }
          timeOffset
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })
})
