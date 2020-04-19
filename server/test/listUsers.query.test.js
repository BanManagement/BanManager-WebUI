const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const { find } = require('lodash')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer } = require('./fixtures')
const { inetTop } = require('../data/ip')

describe('Query listUsers', () => {
  let setup
  let request

  beforeAll(async () => {
    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 20000)

  afterAll(async () => {
    await setup.teardown()
  })

  test('should error if unauthenticated', async () => {
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query listUsers {
        listUsers {
          total
          records {
            id
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should error if limit too large', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listUsers {
        listUsers(limit: 51) {
          total
          records {
            id
            email
            roles {
              role {
                id
                name
              }
            }
            serverRoles {
              serverRole {
                id
                name
              }
              server {
                id
                name
              }
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Limit too large')
  })

  test('should error if offset greater than total', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listUsers {
        listUsers(offset: 51) {
          total
          records {
            id
            email
            roles {
              role {
                id
                name
              }
            }
            serverRoles {
              serverRole {
                id
                name
              }
              server {
                id
                name
              }
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'Offset greater than total')
  })

  test('should resolve all fields', async () => {
    const { pool, config: server } = setup.serversPool.values().next().value

    const player = createPlayer()

    await pool('bm_players').insert(player)
    await setup.dbPool('bm_web_users').insert({ player_id: player.id })
    await setup.dbPool('bm_web_player_roles').insert({ role_id: 2, player_id: player.id })
    await setup.dbPool('bm_web_player_server_roles').insert({ server_Id: server.id, role_id: 1, player_id: player.id })

    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listUsers {
        listUsers {
          total
          records {
            id
            email
            player {
              id
              name
              ip
              lastSeen
            }
            roles {
              role {
                id
                name
              }
            }
            serverRoles {
              serverRole {
                id
                name
              }
              server {
                id
                name
              }
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.listUsers.total, body.data.listUsers.records.length)

    const bodyPlayer = find(body.data.listUsers.records, { id: unparse(player.id) })

    assert(bodyPlayer)

    assert.strictEqual(body.data.listUsers.records.length, 4)
    assert.strictEqual(bodyPlayer.player.name, player.name)
    assert.strictEqual(bodyPlayer.player.lastSeen, player.lastSeen)
    assert.strictEqual(bodyPlayer.player.ip, inetTop(player.ip))

    const roles = bodyPlayer.roles

    assert.strictEqual(roles.length, 1)
    assert.strictEqual(roles[0].role.id, '2')
    assert.strictEqual(roles[0].role.name, 'Logged In')

    const serverRoles = bodyPlayer.serverRoles

    assert.strictEqual(serverRoles.length, 1)
    assert.strictEqual(serverRoles[0].serverRole.id, '1')
    assert.strictEqual(serverRoles[0].serverRole.name, 'Guest')
    assert.strictEqual(serverRoles[0].server.id, server.id)
  })

  test('should filter role', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listUsers {
        listUsers(role: "adm") {
          total
          records {
            id
            email
            roles {
              role {
                id
                name
              }
            }
            serverRoles {
              serverRole {
                id
                name
              }
              server {
                id
                name
              }
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.listUsers.total, body.data.listUsers.records.length)

    const bodyPlayer = body.data.listUsers.records[0]

    assert(bodyPlayer)

    assert.strictEqual(body.data.listUsers.records.length, 1)
    assert.strictEqual(bodyPlayer.email, 'admin@banmanagement.com')

    const roles = bodyPlayer.roles

    assert.strictEqual(roles.length, 1)
    assert.strictEqual(roles[0].role.id, '3')
    assert.strictEqual(roles[0].role.name, 'Admin')

    assert.strictEqual(bodyPlayer.serverRoles.length, 0)
  })

  test('should filter role and return no results', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listUsers {
        listUsers(role: "asd") {
          total
          records {
            id
            email
            roles {
              role {
                id
                name
              }
            }
            serverRoles {
              serverRole {
                id
                name
              }
              server {
                id
                name
              }
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.listUsers.total, body.data.listUsers.records.length)
    assert.strictEqual(body.data.listUsers.records.length, 0)
  })

  test('should filter email', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listUsers {
        listUsers(email: "admin") {
          total
          records {
            id
            email
            roles {
              role {
                id
                name
              }
            }
            serverRoles {
              serverRole {
                id
                name
              }
              server {
                id
                name
              }
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.listUsers.total, body.data.listUsers.records.length)

    const bodyPlayer = body.data.listUsers.records[0]

    assert(bodyPlayer)

    assert.strictEqual(body.data.listUsers.records.length, 1)
    assert.strictEqual(bodyPlayer.email, 'admin@banmanagement.com')

    const roles = bodyPlayer.roles

    assert.strictEqual(roles.length, 1)
    assert.strictEqual(roles[0].role.id, '3')
    assert.strictEqual(roles[0].role.name, 'Admin')

    assert.strictEqual(bodyPlayer.serverRoles.length, 0)
  })

  test('should filter email and return no results', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listUsers {
        listUsers(email: "asd") {
          total
          records {
            id
            email
            roles {
              role {
                id
                name
              }
            }
            serverRoles {
              serverRole {
                id
                name
              }
              server {
                id
                name
              }
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.listUsers.total, body.data.listUsers.records.length)
    assert.strictEqual(body.data.listUsers.records.length, 0)
  })

  test('should resolve filter server roles', async () => {
    const { pool, config: server } = setup.serversPool.values().next().value

    const player = createPlayer()

    await pool('bm_players').insert(player)
    await setup.dbPool('bm_web_users').insert({ player_id: player.id })
    await setup.dbPool('bm_web_roles').insert({ role_id: 4, name: 'Test', parent_role_id: 2 })
    await setup.dbPool('bm_web_player_roles').insert({ role_id: 2, player_id: player.id })
    await setup.dbPool('bm_web_player_server_roles').insert({ server_id: server.id, role_id: 4, player_id: player.id })

    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listUsers {
        listUsers(serverRole: "tes") {
          total
          records {
            id
            email
            player {
              id
              name
              lastSeen
            }
            roles {
              role {
                id
                name
              }
            }
            serverRoles {
              serverRole {
                id
                name
              }
              server {
                id
                name
              }
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.listUsers.total, body.data.listUsers.records.length)

    const bodyPlayer = body.data.listUsers.records[0]

    assert(bodyPlayer)

    assert.strictEqual(body.data.listUsers.records.length, 1)
    assert.strictEqual(bodyPlayer.id, unparse(player.id))
    assert.strictEqual(bodyPlayer.player.name, player.name)
    assert.strictEqual(bodyPlayer.player.lastSeen, player.lastSeen)

    const roles = bodyPlayer.roles

    assert.strictEqual(roles.length, 1)
    assert.strictEqual(roles[0].role.id, '2')
    assert.strictEqual(roles[0].role.name, 'Logged In')

    const serverRoles = bodyPlayer.serverRoles

    assert.strictEqual(serverRoles.length, 1)
    assert.strictEqual(serverRoles[0].serverRole.id, '4')
    assert.strictEqual(serverRoles[0].serverRole.name, 'Test')
    assert.strictEqual(serverRoles[0].server.id, server.id)
  })

  test('should filter server role and return no results', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listUsers {
        listUsers(serverRole: "asd") {
          total
          records {
            id
            email
            roles {
              role {
                id
                name
              }
            }
            serverRoles {
              serverRole {
                id
                name
              }
              server {
                id
                name
              }
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.listUsers.total, 0)
    assert.strictEqual(body.data.listUsers.records.length, 0)
  })

  test('should filter email, role and server role', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listUsers {
        listUsers(email: "admin", role: "admin", serverRole: "admin") {
          total
          records {
            id
            email
            roles {
              role {
                id
                name
              }
            }
            serverRoles {
              serverRole {
                id
                name
              }
              server {
                id
                name
              }
            }
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.listUsers.total, body.data.listUsers.records.length)

    const bodyPlayer = body.data.listUsers.records[0]

    assert(bodyPlayer)

    assert.strictEqual(body.data.listUsers.records.length, 1)
    assert.strictEqual(bodyPlayer.email, 'admin@banmanagement.com')

    const roles = bodyPlayer.roles

    assert.strictEqual(roles.length, 1)
    assert.strictEqual(roles[0].role.id, '3')
    assert.strictEqual(roles[0].role.name, 'Admin')

    assert.strictEqual(bodyPlayer.serverRoles.length, 0)
  })
})
