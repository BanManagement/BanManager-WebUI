const { nanoid } = require('nanoid')
const crypto = require('crypto')

// Generate a consistent content hash for fixtures (based on options or random)
function generateContentHash (options = {}) {
  const seed = options.contentHash || options.id || nanoid()
  return crypto.createHash('sha256').update(seed).digest('hex')
}

// Creates a document content record
function createDocumentContent (options = {}) {
  const contentHash = options.contentHash || generateContentHash(options)
  return {
    content_hash: contentHash,
    path: options.path || `uploads/documents/${contentHash.slice(0, 2)}/${contentHash.slice(2, 4)}/${contentHash}.jpg`,
    mime_type: options.mimeType || 'image/jpeg',
    size: options.size || 1024,
    width: options.width || 800,
    height: options.height || 600
  }
}

// Creates a document record - requires content to be inserted first or provided
function createDocument (player, options = {}) {
  const contentHash = options.contentHash || generateContentHash(options)
  return {
    id: options.id || nanoid(),
    player_id: player.id,
    filename: options.filename || 'test-image.jpg',
    content_hash: contentHash,
    created: options.created || Math.floor(Date.now() / 1000)
  }
}

// Helper to create both content and document records for tests
function createDocumentWithContent (player, options = {}) {
  const contentHash = generateContentHash(options)
  const contentOptions = { ...options, contentHash }
  return {
    content: createDocumentContent(contentOptions),
    document: createDocument(player, contentOptions)
  }
}

// Helper to insert content record (uses INSERT IGNORE for MySQL compatibility)
async function insertContentIgnore (dbPool, content) {
  await dbPool.raw(
    `INSERT IGNORE INTO bm_web_document_contents 
     (content_hash, path, mime_type, size, width, height) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [content.content_hash, content.path, content.mime_type, content.size, content.width, content.height]
  )
}

module.exports = createDocument
module.exports.createDocument = createDocument
module.exports.createDocumentContent = createDocumentContent
module.exports.createDocumentWithContent = createDocumentWithContent
module.exports.generateContentHash = generateContentHash
module.exports.insertContentIgnore = insertContentIgnore
