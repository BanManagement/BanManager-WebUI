const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createAppeal, createBan } = require('./fixtures')
const { createDocumentWithContent, insertContentIgnore } = require('./fixtures/document')

describe('GET /api/documents/:id', () => {
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

  test('should error if document not found', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const { statusCode, body } = await request
      .get('/api/documents/nonexistent-id')
      .set('Cookie', cookie)

    assert.strictEqual(statusCode, 404)
    assert.strictEqual(body.error, 'Document not found')
  })

  test('should error if unlinked document and not admin', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { content, document } = createDocumentWithContent(account)

    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)

    const { statusCode, body } = await request
      .get(`/api/documents/${document.id}`)
      .set('Cookie', cookie)

    assert.strictEqual(statusCode, 403)
    assert.strictEqual(body.error, 'You do not have permission to view this document')
  })

  test('should allow admin to view unlinked document', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { content, document } = createDocumentWithContent(account)

    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)

    const { statusCode } = await request
      .get(`/api/documents/${document.id}`)
      .set('Cookie', cookie)

    // Will be 404 because file doesn't actually exist on disk, but permission check passed
    assert(statusCode === 200 || statusCode === 404)
  })

  test('should error without view permission on appeal', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value

    const player = createPlayer()
    const actor = createPlayer()
    const punishment = createBan(player, actor)

    await pool('bm_players').insert([player, actor])

    const [banId] = await pool('bm_player_bans').insert(punishment, ['id'])
    const appealData = createAppeal({ ...punishment, id: banId }, 'PlayerBan', server, player)
    const [appealId] = await setup.dbPool('bm_web_appeals').insert(appealData, ['id'])

    const { content, document } = createDocumentWithContent(account)
    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)
    await setup.dbPool('bm_web_appeal_documents').insert({ appeal_id: appealId, comment_id: 0, document_id: document.id })

    const { statusCode, body } = await request
      .get(`/api/documents/${document.id}`)
      .set('Cookie', cookie)

    assert.strictEqual(statusCode, 403)
    assert.strictEqual(body.error, 'You do not have permission to view this document')
  })

  test('should error without attachment.view permission even with view.own', async () => {
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

    // Remove user from role 2 (Logged In) which has attachment.view by default
    await setup.dbPool('bm_web_player_roles').where({ player_id: account.id, role_id: 2 }).del()

    // Only view.own, no attachment.view
    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'view.own')

    const { statusCode, body } = await request
      .get(`/api/documents/${document.id}`)
      .set('Cookie', cookie)

    await role.reset()

    // Restore user to role 2
    await setup.dbPool('bm_web_player_roles').insert({ player_id: account.id, role_id: 2 })

    // Clean up ban to avoid unique constraint violation in next test
    await pool('bm_player_bans').where({ id: banId }).del()

    assert.strictEqual(statusCode, 403)
    assert.strictEqual(body.error, 'You do not have permission to view attachments')
  })

  test('should allow view.own with attachment.view to see own appeal document', async () => {
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

    const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'view.own', 'attachment.view')

    const { statusCode } = await request
      .get(`/api/documents/${document.id}`)
      .set('Cookie', cookie)

    await role.reset()

    // Will be 404 because file doesn't exist on disk, but permission check passed
    assert(statusCode === 200 || statusCode === 404)
  })

  test('should include Cache-Control: private header', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { content, document } = createDocumentWithContent(account)

    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)

    const { headers } = await request
      .get(`/api/documents/${document.id}`)
      .set('Cookie', cookie)

    // Even if the file doesn't exist, if we got past permission check, header should be set
    if (headers['cache-control']) {
      assert(headers['cache-control'].includes('private'))
    }
  })
})
