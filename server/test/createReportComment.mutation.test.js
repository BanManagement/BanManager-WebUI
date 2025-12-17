const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createReport } = require('./fixtures')
const { createDocumentWithContent, insertContentIgnore } = require('./fixtures/document')
const { getUnreadNotificationsCount } = require('../data/notification')
const { getReportWatchers, subscribeReport } = require('../data/notification/report')

describe('Mutation createReportComment', () => {
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
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, player)

    await pool('bm_players').insert(player)
    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation createReportComment {
        createReportComment(serverId: "${server.id}", report: ${inserted}, input: { comment: "test" }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should allow comment.any', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, player)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'comment.any', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createReportComment {
        createReportComment(serverId: "${server.id}", report: ${inserted} input: { comment: "test" }) {
          comment
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.createReportComment.comment, 'test')
  })

  test('should allow comment.own', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, account)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'comment.own', 'view.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createReportComment {
        createReportComment(serverId: "${server.id}", report: ${inserted} input: { comment: "test" }) {
          comment
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.createReportComment.comment, 'test')
  })

  test('should allow comment.assigned', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, account)

    report.assignee_id = account.id

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'comment.assigned', 'view.assigned')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createReportComment {
        createReportComment(serverId: "${server.id}", report: ${inserted} input: { comment: "test" }) {
          comment
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.createReportComment.comment, 'test')
  })

  test('should allow comment.reported', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(account, player)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'comment.reported', 'view.reported')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createReportComment {
        createReportComment(serverId: "${server.id}", report: ${inserted} input: { comment: "test" }) {
          comment
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.createReportComment.comment, 'test')
  })

  test('should subscribe player and notify of a new comment', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, player)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])

    await subscribeReport(setup.dbPool, inserted, server.id, player.id)

    const role = await setTempRole(setup.dbPool, player, 'player.reports', 'view.any')
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createReportComment {
        createReportComment(serverId: "${server.id}", report: ${inserted} input: { comment: "test" }) {
          comment
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.createReportComment.comment, 'test')

    const watchers = await getReportWatchers(setup.dbPool, inserted, server.id)
    const notificationCount = await getUnreadNotificationsCount(setup.dbPool, player.id)

    assert.strictEqual(watchers.filter(playerId => playerId.equals(account.id)).length, 1)
    assert.strictEqual(notificationCount, 1)
  })

  test('should error if report does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createReportComment {
        createReportComment(serverId: "${server.id}", report: 123123 input: { comment: "test" }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Report 123123 does not exist')
  })

  test('should error if server does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createReportComment {
        createReportComment(serverId: "3", report: 3 input: { comment: "test" }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Server 3 does not exist')
  })

  test('should error if closed', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, player, null, 3)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createReportComment {
        createReportComment(serverId: "${server.id}", report: ${inserted} input: { comment: "test" }) {
          comment
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'You cannot comment on a closed report')
  })

  test('should error when attaching documents without attachment.create permission', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, player)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])

    const { content, document } = createDocumentWithContent(account)
    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)

    // Only comment.any permission, no attachment.create
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'comment.any', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createReportComment($documents: [ID!]) {
          createReportComment(serverId: "${server.id}", report: ${inserted}, input: { comment: "test", documents: $documents }) {
            comment
          }
        }`,
        variables: { documents: [document.id] }
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)
    assert(body.errors)
    assert.strictEqual(body.errors[0].message, 'You do not have permission to attach files')
  })

  test('should link documents when user has attachment.create permission', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, player)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])

    const { content, document } = createDocumentWithContent(account)
    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)

    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'comment.any', 'view.any', 'attachment.create', 'attachment.view')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createReportComment($documents: [ID!]) {
          createReportComment(serverId: "${server.id}", report: ${inserted}, input: { comment: "test with attachment", documents: $documents }) {
            id
            comment
            documents {
              id
              filename
            }
          }
        }`,
        variables: { documents: [document.id] }
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)
    assert(body.data)
    assert.strictEqual(body.data.createReportComment.comment, 'test with attachment')
    assert.strictEqual(body.data.createReportComment.documents.length, 1)
    assert.strictEqual(body.data.createReportComment.documents[0].id, document.id)
  })

  test('should not link documents owned by another player', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const otherPlayer = createPlayer()
    const report = createReport(player, player)

    await pool('bm_players').insert([player, otherPlayer])

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])

    // Create document belonging to another player
    const { content, document } = createDocumentWithContent(otherPlayer)
    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)

    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'comment.any', 'view.any', 'attachment.create', 'attachment.view')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createReportComment($documents: [ID!]) {
          createReportComment(serverId: "${server.id}", report: ${inserted}, input: { comment: "test", documents: $documents }) {
            id
            comment
            documents {
              id
            }
          }
        }`,
        variables: { documents: [document.id] }
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)
    assert(body.data)
    assert.strictEqual(body.data.createReportComment.documents.length, 0)
  })

  test('should error when attaching more than 3 documents', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, player)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])

    // Create 4 documents
    const docs = [
      createDocumentWithContent(account),
      createDocumentWithContent(account),
      createDocumentWithContent(account),
      createDocumentWithContent(account)
    ]
    for (const { content, document } of docs) {
      await insertContentIgnore(setup.dbPool, content)
      await setup.dbPool('bm_web_documents').insert(document)
    }
    const documents = docs.map(d => d.document)

    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'comment.any', 'view.any', 'attachment.create')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createReportComment($documents: [ID!]) {
          createReportComment(serverId: "${server.id}", report: ${inserted}, input: { comment: "test", documents: $documents }) {
            id
            comment
          }
        }`,
        variables: { documents: documents.map(d => d.id) }
      })

    await role.reset()

    assert.strictEqual(statusCode, 400)
    assert(body.errors)
    assert(body.errors[0].message.includes('3'))
  })
})
