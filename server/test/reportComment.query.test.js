const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer, createReport } = require('./fixtures')

describe('Query reportComment', () => {
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

  test('should require player.reports.view.comments permission', async () => {
    const { config: server } = setup.serversPool.values().next().value
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `query reportComment {
          reportComment(id:"1", serverId: "${server.id}") {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should resolve all fields', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value

    const player = createPlayer()
    const actor = createPlayer()
    const report = createReport(player, actor)

    await pool('bm_players').insert([player, actor])

    const [reportId] = await pool('bm_player_reports').insert(report, ['id'])
    const [id] = await pool('bm_player_report_comments').insert({
      report_id: reportId,
      actor_id: actor.id,
      comment: 'asdasdasd',
      created: report.created,
      updated: report.updated
    }, ['id'])
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query reportComment {
          reportComment(id:"${id}", serverId: "${server.id}") {
            id
            comment
            created
            updated
            actor {
              id
              name
            }
            acl {
              delete
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.reportComment,
      {
        id: id.toString(),
        comment: 'asdasdasd',
        created: report.created,
        updated: report.updated,
        actor: { id: unparse(actor.id), name: actor.name },
        acl: { delete: true }
      })
  })
})
