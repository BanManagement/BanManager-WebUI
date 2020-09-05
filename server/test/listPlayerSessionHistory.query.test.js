const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const { find } = require('lodash')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer } = require('./fixtures')
const { inetTop } = require('../data/ip')

describe('Query listPlayerSessionHistory', () => {
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
    const { config: server } = setup.serversPool.values().next().value

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query listPlayerSessionHistory {
          listPlayerSessionHistory(serverId: "${server.id}") {
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
    const { config: server } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listPlayerSessionHistory {
          listPlayerSessionHistory(serverId: "${server.id}" limit: 51) {
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
      'Limit too large')
  })

  test('should error if offset greater than total', async () => {
    const { config: server } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listPlayerSessionHistory {
          listPlayerSessionHistory(serverId: "${server.id}", offset: 1000) {
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
      'Offset greater than total')
  })

  test('should resolve all fields', async () => {
    const { pool, config: server } = setup.serversPool.values().next().value

    const player = createPlayer()
    const history = []
    const now = Math.floor(Date.now() / 1000)

    for (let i = 0; i < 30; i++) {
      history.push({ player_id: player.id, ip: player.ip, join: now - (i * 10000), leave: now - (i * 10000) })
    }

    await pool('bm_players').insert(player)
    await pool('bm_player_history').insert(history)

    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listPlayerSessionHistory {
          listPlayerSessionHistory(serverId: "${server.id}", limit: 30) {
            total
            records {
              id
              ip
              join
              leave
              player {
                id
                name
                ip
                lastSeen
              }
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.listPlayerSessionHistory.total, body.data.listPlayerSessionHistory.records.length)

    const bodyPlayer = find(body.data.listPlayerSessionHistory.records, { player: { id: unparse(player.id) } })

    assert(bodyPlayer)

    const ip = inetTop(player.ip)

    assert.strictEqual(body.data.listPlayerSessionHistory.records.length, 30)
    assert.strictEqual(bodyPlayer.player.name, player.name)
    assert.strictEqual(bodyPlayer.player.lastSeen, player.lastSeen)
    assert.strictEqual(bodyPlayer.player.ip, ip)

    const record = body.data.listPlayerSessionHistory.records[0]

    assert.strictEqual(record.ip, ip)
    assert(record.join)
    assert(record.leave)
  })

  test('should filter player and offset', async () => {
    const { config: server, pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const players = [createPlayer(), createPlayer()]
    const history = []
    for (let i = 0; i < 30; i++) {
      history.push({ player_id: players[0].id, ip: players[0].ip, join: i * 10000, leave: i * 10000 })
      history.push({ player_id: players[1].id, ip: players[1].ip, join: i * 10000, leave: i * 10000 })
    }

    await pool('bm_players').insert(players)
    await pool('bm_player_history').insert(history)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listPlayerSessionHistory {
          listPlayerSessionHistory(serverId: "${server.id}" player: "${unparse(players[0].id)}" limit: 5, offset: 5, order: leave_ASC) {
            total
            records {
              id
              ip
              join
              leave
              player {
                id
                name
                ip
                lastSeen
              }
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.listPlayerSessionHistory.total, 30)
    assert.strictEqual(body.data.listPlayerSessionHistory.records.length, 5)

    const player = players[0]
    const id = unparse(player.id)
    const ip = inetTop(player.ip)

    for (const [index, record] of body.data.listPlayerSessionHistory.records.entries()) {
      assert.strictEqual(record.ip, ip)
      assert.strictEqual(record.join, (index + 5) * 10000)
      assert.strictEqual(record.leave, (index + 5) * 10000)

      assert.strictEqual(record.player.id, id)
      assert.strictEqual(record.player.name, player.name)
      assert.strictEqual(record.player.lastSeen, player.lastSeen)
      assert.strictEqual(record.player.ip, ip)
    }
  })
})
