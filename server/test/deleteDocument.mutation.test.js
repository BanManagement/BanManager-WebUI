const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createAppeal, createBan } = require('./fixtures')
const { createDocumentWithContent, insertContentIgnore } = require('./fixtures/document')

describe('Mutation deleteDocument', () => {
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
        query: `mutation deleteDocument {
          deleteDocument(id: "test-id") {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body.errors)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should error if document does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteDocument {
          deleteDocument(id: "nonexistent-id") {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body.errors)
    assert.strictEqual(body.errors[0].message, 'Document nonexistent-id does not exist')
  })

  test('should error without delete permission on unlinked document', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { content, document } = createDocumentWithContent(account)

    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteDocument {
          deleteDocument(id: "${document.id}") {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body.errors)
    assert.strictEqual(body.errors[0].message, 'You do not have permission to delete this document')
  })

  test('should allow admin to delete any document', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const userCookie = await getAuthPassword(request, 'user@banmanagement.com')
    const userAccount = await getAccount(request, userCookie)

    const { content, document } = createDocumentWithContent(userAccount)
    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteDocument {
          deleteDocument(id: "${document.id}") {
            id
          }
        }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body.data)
    assert.strictEqual(body.data.deleteDocument.id, document.id)

    // Verify document deleted
    const [deleted] = await setup.dbPool('bm_web_documents').where({ id: document.id })
    assert(!deleted)

    // Verify content also deleted (no more references)
    const [deletedContent] = await setup.dbPool('bm_web_document_contents').where({ content_hash: content.content_hash })
    assert(!deletedContent)
  })

  test('should allow attachment.delete.own on appeal document', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value

    const actor = createPlayer()
    const punishment = createBan(account, actor)

    await pool('bm_players').insert([actor])

    const [banId] = await pool('bm_player_bans').insert(punishment, ['id'])
    const appealData = createAppeal({ ...punishment, id: banId }, 'PlayerBan', server, account)
    const [appealId] = await setup.dbPool('bm_web_appeals').insert(appealData, ['id'])

    const { content, document } = createDocumentWithContent(account)
    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)
    await setup.dbPool('bm_web_appeal_documents').insert({ appeal_id: appealId, comment_id: 0, document_id: document.id })

    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'attachment.delete.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteDocument {
          deleteDocument(id: "${document.id}") {
            id
          }
        }`
      })

    await role.reset()

    // Clean up ban to avoid unique constraint violation in next test
    await pool('bm_player_bans').where({ id: banId }).del()

    assert.strictEqual(statusCode, 200)
    assert(body.data)
    assert.strictEqual(body.data.deleteDocument.id, document.id)
  })

  test('should not allow attachment.delete.own on other user document', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)

    const adminCookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const adminAccount = await getAccount(request, adminCookie)

    const { config: server, pool } = setup.serversPool.values().next().value

    const actor = createPlayer()
    const punishment = createBan(account, actor)

    await pool('bm_players').insert([actor])

    const [banId] = await pool('bm_player_bans').insert(punishment, ['id'])
    const appealData = createAppeal({ ...punishment, id: banId }, 'PlayerBan', server, account)
    const [appealId] = await setup.dbPool('bm_web_appeals').insert(appealData, ['id'])

    // Document uploaded by admin
    const { content, document } = createDocumentWithContent(adminAccount)
    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)
    await setup.dbPool('bm_web_appeal_documents').insert({ appeal_id: appealId, comment_id: 0, document_id: document.id })

    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'attachment.delete.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteDocument {
          deleteDocument(id: "${document.id}") {
            id
          }
        }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)
    assert(body.errors)
    assert.strictEqual(body.errors[0].message, 'You do not have permission to delete this document')
  })

  test('should remove document from junction table', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const adminAccount = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value

    const actor = createPlayer()
    const punishment = createBan(adminAccount, actor)

    await pool('bm_players').insert([actor])

    const [banId] = await pool('bm_player_bans').insert(punishment, ['id'])
    const appealData = createAppeal({ ...punishment, id: banId }, 'PlayerBan', server, adminAccount)
    const [appealId] = await setup.dbPool('bm_web_appeals').insert(appealData, ['id'])

    const { content, document } = createDocumentWithContent(adminAccount)
    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)
    await setup.dbPool('bm_web_appeal_documents').insert({ appeal_id: appealId, comment_id: 0, document_id: document.id })

    await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteDocument {
          deleteDocument(id: "${document.id}") {
            id
          }
        }`
      })

    // Verify junction table entry removed
    const [link] = await setup.dbPool('bm_web_appeal_documents').where({ document_id: document.id })
    assert(!link)
  })

  test('should keep content when other documents still reference it', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const adminAccount = await getAccount(request, cookie)

    // Create shared content with two documents
    const { content, document: doc1 } = createDocumentWithContent(adminAccount, { filename: 'doc1.jpg' })
    const doc2 = {
      id: require('nanoid').nanoid(),
      player_id: adminAccount.id,
      filename: 'doc2.jpg',
      content_hash: content.content_hash,
      created: Math.floor(Date.now() / 1000)
    }

    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert([doc1, doc2])

    // Delete first document
    await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation deleteDocument {
          deleteDocument(id: "${doc1.id}") {
            id
          }
        }`
      })

    // Verify first document deleted
    const [deletedDoc] = await setup.dbPool('bm_web_documents').where({ id: doc1.id })
    assert(!deletedDoc)

    // Verify content still exists (second doc still references it)
    const [contentExists] = await setup.dbPool('bm_web_document_contents').where({ content_hash: content.content_hash })
    assert(contentExists)

    // Verify second document still exists
    const [doc2Exists] = await setup.dbPool('bm_web_documents').where({ id: doc2.id })
    assert(doc2Exists)
  })
})
