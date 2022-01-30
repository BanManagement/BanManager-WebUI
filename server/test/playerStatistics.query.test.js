const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createPlayer, createBan, createBanRecord, createMute, createMuteRecord, createWarning, createReport } = require('./fixtures')
const { createSetup } = require('./lib')

describe('Query playerStatistics', () => {
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
    const { pool } = setup.serversPool.values().next().value

    const player = createPlayer()
    const actor = createPlayer()
    const ban = createBan(player, actor)
    const banRecord = createBanRecord(player, actor)
    const mute = createMute(player, actor)
    const muteRecord = createMuteRecord(player, actor)
    const warning = createWarning(player, actor)
    const report = createReport(player, actor)

    await pool('bm_players').insert([player, actor])
    await pool('bm_player_bans').insert(ban)
    await pool('bm_player_ban_records').insert(banRecord)
    await pool('bm_player_mutes').insert(mute)
    await pool('bm_player_mute_records').insert(muteRecord)
    await pool('bm_player_warnings').insert(warning)
    await pool('bm_player_reports').insert(report)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query playerStatistics {
          playerStatistics(player: "${unparse(player.id)}") {
            totalActiveBans
            totalActiveMutes
            totalBans
            totalMutes
            totalWarnings
            totalReports
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)

    assert.strictEqual(body.data.playerStatistics.totalActiveBans, 1)
    assert.strictEqual(body.data.playerStatistics.totalActiveMutes, 1)
    assert.strictEqual(body.data.playerStatistics.totalBans, 1)
    assert.strictEqual(body.data.playerStatistics.totalMutes, 1)
    assert.strictEqual(body.data.playerStatistics.totalWarnings, 1)
    assert.strictEqual(body.data.playerStatistics.totalReports, 1)
  })
})
