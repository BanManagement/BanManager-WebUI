const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createAppeal, createBan } = require('./fixtures')
const { createDocumentWithContent, insertContentIgnore } = require('./fixtures/document')
const { getUnreadNotificationsCount } = require('../data/notification')
const { getAppealWatchers, subscribeAppeal } = require('../data/notification/appeal')

describe('Mutation createAppealComment', () => {
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
    const actor = createPlayer()
    const punishment = createBan(actor, actor)

    await pool('bm_players').insert([actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, actor)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment {
        createAppealComment(id: ${inserted}, input: { content: "test" }) {
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
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'comment.any', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment {
        createAppealComment(id: ${inserted} input: { content: "test" }) {
          content
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.createAppealComment.content, 'test')
  })

  test('should allow comment.own', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const actor = createPlayer()
    const punishment = createBan(account, actor)

    await pool('bm_players').insert([actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'comment.own', 'view.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment {
        createAppealComment(id: ${inserted} input: { content: "test" }) {
          content
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.createAppealComment.content, 'test')
  })

  test('should allow comment.assigned', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, actor, account)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'comment.assigned', 'view.assigned')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment {
        createAppealComment(id: ${inserted} input: { content: "test" }) {
          content
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.createAppealComment.content, 'test')
  })

  test('should subscribe player and notify of a new comment', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, player)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    await subscribeAppeal(setup.dbPool, inserted, player.id)

    const role = await setTempRole(setup.dbPool, player, 'player.appeals', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment {
        createAppealComment(id: ${inserted} input: { content: "test" }) {
          content
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.createAppealComment.content, 'test')

    const watchers = await getAppealWatchers(setup.dbPool, inserted)
    const notificationCount = await getUnreadNotificationsCount(setup.dbPool, player.id)

    assert.strictEqual(watchers.filter(playerId => playerId.equals(player.id)).length, 1)
    assert.strictEqual(notificationCount, 1)
  })

  test('should error if appeal does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment {
        createAppealComment(id: 123123 input: { content: "test" }) {
          id
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Appeal 123123 does not exist')
  })

  test('should error if closed', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [id] = await pool('bm_player_bans').insert(punishment, ['id'])
    const data = createAppeal({ ...punishment, id }, 'PlayerBan', server, account, null, 3)
    const [inserted] = await pool('bm_web_appeals').insert(data, ['id'])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment {
        createAppealComment(id: ${inserted} input: { content: "test" }) {
          content
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'You cannot comment on a closed appeal')
  })

  test('should error when attaching documents without attachment.create permission', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [banId] = await pool('bm_player_bans').insert(punishment, ['id'])
    const appeal = createAppeal({ ...punishment, id: banId }, 'PlayerBan', server, account)
    const [appealId] = await pool('bm_web_appeals').insert(appeal, ['id'])

    const { content, document } = createDocumentWithContent(account)
    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)

    // Only comment.any permission, no attachment.create
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'comment.any', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment($documents: [ID!]) {
          createAppealComment(id: ${appealId} input: { content: "test", documents: $documents }) {
            content
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
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [banId] = await pool('bm_player_bans').insert(punishment, ['id'])
    const appeal = createAppeal({ ...punishment, id: banId }, 'PlayerBan', server, account)
    const [appealId] = await pool('bm_web_appeals').insert(appeal, ['id'])

    const { content, document } = createDocumentWithContent(account)
    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)

    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'comment.any', 'view.any', 'attachment.create')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment($documents: [ID!]) {
          createAppealComment(id: ${appealId} input: { content: "test with attachment", documents: $documents }) {
            id
            content
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
    assert.strictEqual(body.data.createAppealComment.content, 'test with attachment')
    assert.strictEqual(body.data.createAppealComment.documents.length, 1)
    assert.strictEqual(body.data.createAppealComment.documents[0].id, document.id)

    // Verify database link was created
    const [link] = await setup.dbPool('bm_web_appeal_documents')
      .where({ appeal_id: appealId, comment_id: body.data.createAppealComment.id, document_id: document.id })
    assert(link)
  })

  test('should not link documents belonging to another user', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const otherPlayer = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor, otherPlayer])

    const [banId] = await pool('bm_player_bans').insert(punishment, ['id'])
    const appeal = createAppeal({ ...punishment, id: banId }, 'PlayerBan', server, account)
    const [appealId] = await pool('bm_web_appeals').insert(appeal, ['id'])

    // Create document belonging to another player
    const { content, document } = createDocumentWithContent(otherPlayer)
    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)

    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'comment.any', 'view.any', 'attachment.create')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment($documents: [ID!]) {
          createAppealComment(id: ${appealId} input: { content: "test", documents: $documents }) {
            id
            content
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
    // Comment should be created but no documents linked
    assert.strictEqual(body.data.createAppealComment.content, 'test')
    assert.strictEqual(body.data.createAppealComment.documents.length, 0)
  })

  test('should ignore non-existent document IDs', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [banId] = await pool('bm_player_bans').insert(punishment, ['id'])
    const appeal = createAppeal({ ...punishment, id: banId }, 'PlayerBan', server, account)
    const [appealId] = await pool('bm_web_appeals').insert(appeal, ['id'])

    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'comment.any', 'view.any', 'attachment.create')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment($documents: [ID!]) {
          createAppealComment(id: ${appealId} input: { content: "test", documents: $documents }) {
            id
            content
            documents {
              id
            }
          }
        }`,
        variables: { documents: ['nonexistent-doc-id-1', 'nonexistent-doc-id-2'] }
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)
    assert(body.data)
    // Comment should be created but no documents linked
    assert.strictEqual(body.data.createAppealComment.content, 'test')
    assert.strictEqual(body.data.createAppealComment.documents.length, 0)
  })

  test('should error when attaching more than 3 documents', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [banId] = await pool('bm_player_bans').insert(punishment, ['id'])
    const appeal = createAppeal({ ...punishment, id: banId }, 'PlayerBan', server, account)
    const [appealId] = await pool('bm_web_appeals').insert(appeal, ['id'])

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

    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'comment.any', 'view.any', 'attachment.create')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation createAppealComment($documents: [ID!]) {
          createAppealComment(id: ${appealId} input: { content: "test", documents: $documents }) {
            id
            content
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
