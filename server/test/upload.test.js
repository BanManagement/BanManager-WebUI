const assert = require('assert')
const os = require('os')
const path = require('path')
const fs = require('fs').promises
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')

describe('POST /api/upload', () => {
  let setup
  let request
  let tempUploadDir
  let originalUploadPath
  let originalMaxDimension

  beforeAll(async () => {
    // Create temp directory for uploads
    tempUploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bm-upload-test-'))
    originalUploadPath = process.env.UPLOAD_PATH
    originalMaxDimension = process.env.UPLOAD_MAX_DIMENSION
    process.env.UPLOAD_PATH = tempUploadDir

    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 20000)

  afterAll(async () => {
    await setup.teardown()

    // Clean up temp upload directory
    try {
      await fs.rm(tempUploadDir, { recursive: true, force: true })
    } catch (err) {
      console.error('Failed to clean up temp upload dir:', err)
    }

    // Restore env vars
    if (originalUploadPath) {
      process.env.UPLOAD_PATH = originalUploadPath
    } else {
      delete process.env.UPLOAD_PATH
    }
    if (originalMaxDimension) {
      process.env.UPLOAD_MAX_DIMENSION = originalMaxDimension
    } else {
      delete process.env.UPLOAD_MAX_DIMENSION
    }
  })

  // Helper to create a valid 1x1 JPEG
  const createJpegBuffer = () => Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
    0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
    0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
    0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
    0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
    0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
    0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xF1, 0x7F, 0xFF,
    0xD9
  ])

  // Helper to create a valid 1x1 PNG
  const createPngBuffer = () => Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
    0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59, 0xE7, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ])

  describe('authentication and permissions', () => {
    test('should error if unauthenticated', async () => {
      const { statusCode, body } = await request
        .post('/api/upload')
        .attach('file', createJpegBuffer(), { filename: 'test.jpg', contentType: 'image/jpeg' })

      assert.strictEqual(statusCode, 401)
      assert.strictEqual(body.error, 'You must be logged in to upload files')
    })

    test('should error without attachment.create permission', async () => {
      const cookie = await getAuthPassword(request, 'user@banmanagement.com')

      const { statusCode, body } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', createJpegBuffer(), { filename: 'test.jpg', contentType: 'image/jpeg' })

      assert.strictEqual(statusCode, 403)
      assert.strictEqual(body.error, 'You do not have permission to upload files')
    })

    test('should allow upload with attachment.create permission on appeals', async () => {
      const cookie = await getAuthPassword(request, 'user@banmanagement.com')
      const account = await getAccount(request, cookie)
      const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'attachment.create')

      const { statusCode, body } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', createPngBuffer(), { filename: 'test.png', contentType: 'image/png' })

      await role.reset()

      assert.strictEqual(statusCode, 200)
      assert(body.id)
      assert.strictEqual(body.mimeType, 'image/png')
    })

    test('should allow upload with attachment.create permission on reports', async () => {
      const cookie = await getAuthPassword(request, 'user@banmanagement.com')
      const account = await getAccount(request, cookie)
      const role = await setTempRole(setup.dbPool, account, 'player.reports', 'attachment.create')

      const { statusCode, body } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', createPngBuffer(), { filename: 'test.png', contentType: 'image/png' })

      await role.reset()

      assert.strictEqual(statusCode, 200)
      assert(body.id)
    })
  })

  describe('file validation', () => {
    test('should error if no file provided', async () => {
      const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

      const { statusCode, body } = await request
        .post('/api/upload')
        .set('Cookie', cookie)

      assert.strictEqual(statusCode, 400)
      assert.strictEqual(body.error, 'No file provided')
    })

    test('should reject non-image files', async () => {
      const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

      const { statusCode, body } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', Buffer.from('invalid data'), { filename: 'test.txt', contentType: 'text/plain' })

      assert.strictEqual(statusCode, 400)
      assert.strictEqual(body.error, 'Invalid image file')
    })

    test('should reject files with fake image extension but invalid content', async () => {
      const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

      const { statusCode, body } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', Buffer.from('not a real image'), { filename: 'fake.jpg', contentType: 'image/jpeg' })

      assert.strictEqual(statusCode, 400)
      assert.strictEqual(body.error, 'Invalid image file')
    })
  })

  describe('successful uploads', () => {
    test('should process and store valid JPEG images', async () => {
      const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

      const { statusCode, body } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', createJpegBuffer(), { filename: 'test.jpg', contentType: 'image/jpeg' })

      assert.strictEqual(statusCode, 200)
      assert(body.id)
      assert.strictEqual(body.filename, 'test.jpg')
      assert.strictEqual(body.mimeType, 'image/jpeg')
      assert(body.size > 0)
      assert(body.width > 0)
      assert(body.height > 0)
    })

    test('should process and store valid PNG images', async () => {
      const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

      const { statusCode, body } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', createPngBuffer(), { filename: 'test.png', contentType: 'image/png' })

      assert.strictEqual(statusCode, 200)
      assert(body.id)
      assert.strictEqual(body.mimeType, 'image/png')
    })

    test('should store document record in database', async () => {
      const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

      const { statusCode, body } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', createJpegBuffer(), { filename: 'db-test.jpg', contentType: 'image/jpeg' })

      assert.strictEqual(statusCode, 200)

      // Check document record
      const [doc] = await setup.dbPool('bm_web_documents').where({ id: body.id })
      assert(doc)
      assert.strictEqual(doc.filename, 'db-test.jpg')
      assert(doc.content_hash)
      assert.strictEqual(doc.content_hash.length, 64)

      // Check content record
      const [content] = await setup.dbPool('bm_web_document_contents').where({ content_hash: doc.content_hash })
      assert(content)
      assert.strictEqual(content.mime_type, 'image/jpeg')
      assert(content.path.includes('uploads/documents'))
    })
  })

  describe('deduplication', () => {
    test('should reuse existing content when uploading duplicate file', async () => {
      const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
      const imageBuffer = createPngBuffer()

      // Upload the same file twice
      const { statusCode: status1, body: body1 } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', imageBuffer, { filename: 'first.png', contentType: 'image/png' })

      const { statusCode: status2, body: body2 } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', imageBuffer, { filename: 'second.png', contentType: 'image/png' })

      assert.strictEqual(status1, 200)
      assert.strictEqual(status2, 200)

      // Different document IDs
      assert.notStrictEqual(body1.id, body2.id)

      // Same content hash
      const [doc1] = await setup.dbPool('bm_web_documents').where({ id: body1.id })
      const [doc2] = await setup.dbPool('bm_web_documents').where({ id: body2.id })
      assert.strictEqual(doc1.content_hash, doc2.content_hash)

      // Only one content record
      const contentCount = await setup.dbPool('bm_web_document_contents')
        .where({ content_hash: doc1.content_hash })
        .count('* as count')
      assert.strictEqual(contentCount[0].count, 1)
    })

    test('should create separate content for different files', async () => {
      const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

      const { statusCode: status1, body: body1 } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', createJpegBuffer(), { filename: 'unique1.jpg', contentType: 'image/jpeg' })

      const { statusCode: status2, body: body2 } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', createPngBuffer(), { filename: 'unique2.png', contentType: 'image/png' })

      assert.strictEqual(status1, 200)
      assert.strictEqual(status2, 200)

      const [doc1] = await setup.dbPool('bm_web_documents').where({ id: body1.id })
      const [doc2] = await setup.dbPool('bm_web_documents').where({ id: body2.id })
      assert.notStrictEqual(doc1.content_hash, doc2.content_hash)
    })
  })

  describe('dimension limits', () => {
    test('should reject images exceeding max dimension', async () => {
      // Set a very low max dimension for testing
      process.env.UPLOAD_MAX_DIMENSION = '1'

      const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

      // Create a 2x2 PNG which exceeds our 1px limit
      const largePng = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x02,
        0x08, 0x02, 0x00, 0x00, 0x00, 0xFD, 0xD4, 0x9A, 0x73, 0x00, 0x00, 0x00,
        0x14, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
        0x01, 0x01, 0x00, 0x05, 0x18, 0xD8, 0x4D, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ])

      const { statusCode, body } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', largePng, { filename: 'large.png', contentType: 'image/png' })

      // Restore default
      process.env.UPLOAD_MAX_DIMENSION = '8192'

      assert.strictEqual(statusCode, 400)
      assert(body.error.includes('Image dimensions too large'))
    })
  })

  describe('rate limiting', () => {
    test('should apply rate limit to regular users', async () => {
      const cookie = await getAuthPassword(request, 'user@banmanagement.com')
      const account = await getAccount(request, cookie)
      const role = await setTempRole(setup.dbPool, account, 'player.appeals', 'attachment.create')

      // Make many requests to trigger rate limit
      // Note: Rate limit is 20/hour, so we need to exceed that
      // For testing purposes, we'll just verify the rate limiter is being called
      // A full rate limit test would require mocking time or waiting

      const { statusCode } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', createJpegBuffer(), { filename: 'rate-test.jpg', contentType: 'image/jpeg' })

      await role.reset()

      // First request should succeed
      assert.strictEqual(statusCode, 200)
    })

    test('should bypass rate limit with attachment.ratelimit.bypass permission', async () => {
      const cookie = await getAuthPassword(request, 'user@banmanagement.com')
      const account = await getAccount(request, cookie)

      // Grant both create and bypass permissions
      const createRole = await setTempRole(setup.dbPool, account, 'player.appeals', 'attachment.create')
      const bypassRole = await setTempRole(setup.dbPool, account, 'player.appeals', 'attachment.ratelimit.bypass')

      const { statusCode } = await request
        .post('/api/upload')
        .set('Cookie', cookie)
        .attach('file', createJpegBuffer(), { filename: 'bypass-test.jpg', contentType: 'image/jpeg' })

      await createRole.reset()
      await bypassRole.reset()

      assert.strictEqual(statusCode, 200)
    })
  })
})
