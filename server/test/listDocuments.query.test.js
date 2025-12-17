const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount } = require('./lib')
const { createDocumentWithContent, insertContentIgnore } = require('./fixtures/document')

describe('Query listDocuments', () => {
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

  test('should error without servers.manage permission', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listDocuments {
          listDocuments {
            total
            records {
              id
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body.errors)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should return paginated results', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)

    // Create test documents
    const docs = [
      createDocumentWithContent(account, { created: Math.floor(Date.now() / 1000) - 100 }),
      createDocumentWithContent(account, { created: Math.floor(Date.now() / 1000) - 50 }),
      createDocumentWithContent(account, { created: Math.floor(Date.now() / 1000) })
    ]

    for (const { content, document } of docs) {
      await insertContentIgnore(setup.dbPool, content)
      await setup.dbPool('bm_web_documents').insert(document)
    }

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listDocuments {
          listDocuments(limit: 2) {
            total
            records {
              id
              filename
              mimeType
              size
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body.data)
    assert(body.data.listDocuments.total >= 3)
    assert.strictEqual(body.data.listDocuments.records.length, 2)
  })

  test('should filter by player', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)

    const userCookie = await getAuthPassword(request, 'user@banmanagement.com')
    const userAccount = await getAccount(request, userCookie)

    // Create documents for different users
    const { content: adminContent, document: adminDoc } = createDocumentWithContent(account)
    const { content: userContent, document: userDoc } = createDocumentWithContent(userAccount)

    await insertContentIgnore(setup.dbPool, adminContent)
    await insertContentIgnore(setup.dbPool, userContent)
    await setup.dbPool('bm_web_documents').insert([adminDoc, userDoc])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listDocuments($player: UUID!) {
          listDocuments(player: $player) {
            total
            records {
              id
              player {
                id
              }
            }
          }
        }`,
        variables: { player: unparse(userAccount.id) }
      })

    assert.strictEqual(statusCode, 200)
    assert(body.data)
    assert(body.data.listDocuments.total >= 1)

    // All returned documents should belong to user
    body.data.listDocuments.records.forEach(doc => {
      assert.strictEqual(doc.player.id, unparse(userAccount.id))
    })
  })

  test('should filter by date range', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)

    const now = Math.floor(Date.now() / 1000)
    const hourAgo = now - 3600
    const twoHoursAgo = now - 7200

    // Create documents with different timestamps
    const { content: oldContent, document: oldDoc } = createDocumentWithContent(account, { created: twoHoursAgo })
    const { content: newContent, document: newDoc } = createDocumentWithContent(account, { created: now })

    await insertContentIgnore(setup.dbPool, oldContent)
    await insertContentIgnore(setup.dbPool, newContent)
    await setup.dbPool('bm_web_documents').insert([oldDoc, newDoc])

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listDocuments($dateStart: Timestamp!, $dateEnd: Timestamp!) {
          listDocuments(dateStart: $dateStart, dateEnd: $dateEnd) {
            total
            records {
              id
              created
            }
          }
        }`,
        variables: { dateStart: hourAgo, dateEnd: now + 60 }
      })

    assert.strictEqual(statusCode, 200)
    assert(body.data)

    // All returned documents should be within date range
    body.data.listDocuments.records.forEach(doc => {
      assert(doc.created >= hourAgo)
      assert(doc.created <= now + 60)
    })
  })

  test('should include player information', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const account = await getAccount(request, cookie)

    const { content, document } = createDocumentWithContent(account)
    await insertContentIgnore(setup.dbPool, content)
    await setup.dbPool('bm_web_documents').insert(document)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query listDocuments {
          listDocuments(limit: 1) {
            records {
              id
              player {
                id
                name
              }
            }
          }
        }`
      })

    assert.strictEqual(statusCode, 200)
    assert(body.data)
    assert(body.data.listDocuments.records.length > 0)
    assert(body.data.listDocuments.records[0].player)
    assert(body.data.listDocuments.records[0].player.id)
  })
})
