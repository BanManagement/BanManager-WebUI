const path = require('path')
const fs = require('fs').promises
const { nanoid } = require('nanoid')
const sharp = require('sharp')
const filesizeParser = require('filesize-parser')
const requestIp = require('request-ip')
const { RateLimiterMySQL } = require('rate-limiter-flexible')
const { valid } = require('../data/session')
const { hashContent, getContentPath } = require('../data/hash-content')

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = filesizeParser(process.env.UPLOAD_MAX_SIZE || '10MB')
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads/documents'

function getMaxDimension () {
  return parseInt(process.env.UPLOAD_MAX_DIMENSION || '8192', 10)
}

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
}

async function ensureUploadDir (uploadPath) {
  try {
    await fs.access(uploadPath)
  } catch {
    await fs.mkdir(uploadPath, { recursive: true })
  }
}

module.exports = function uploadRoute (dbPool) {
  // Rate limiter: 20 uploads per hour per IP
  const uploadLimiter = new RateLimiterMySQL({
    storeType: 'knex',
    storeClient: dbPool,
    dbName: dbPool.client.config.connection.database,
    tableName: 'bm_web_rate_limits',
    tableCreated: true,
    keyPrefix: 'upload_ip',
    points: 20,
    duration: 60 * 60, // 1 hour
    blockDuration: 60 * 60 // Block for 1 hour if exceeded
  })

  return async (ctx) => {
    const { acl } = ctx.state
    const session = ctx.session

    if (!valid(session)) {
      ctx.status = 401
      ctx.body = { error: 'You must be logged in to upload files' }
      return
    }

    // Check rate limit (skip for users with bypass permission)
    const canBypassRateLimit = acl.hasPermission('player.appeals', 'attachment.ratelimit.bypass') ||
                               acl.hasPermission('player.reports', 'attachment.ratelimit.bypass')

    if (!canBypassRateLimit) {
      const ipAddr = requestIp.getClientIp(ctx.request)
      try {
        await uploadLimiter.consume(ipAddr)
      } catch (rateLimitError) {
        if (rateLimitError instanceof Error) throw rateLimitError

        const retrySecs = Math.round(rateLimitError.msBeforeNext / 1000) || 1
        ctx.set('Retry-After', String(retrySecs))
        ctx.status = 429
        ctx.body = { error: 'Too many uploads. Please try again later.' }
        return
      }
    }

    // Check if user has attachment.create permission for appeals OR reports
    const hasAppealsPermission = acl.hasPermission('player.appeals', 'attachment.create')
    const hasReportsPermission = acl.hasPermission('player.reports', 'attachment.create')

    if (!hasAppealsPermission && !hasReportsPermission) {
      ctx.status = 403
      ctx.body = { error: 'You do not have permission to upload files' }
      return
    }

    const file = ctx.request.file

    if (!file) {
      ctx.status = 400
      ctx.body = { error: 'No file provided' }
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      ctx.status = 400
      ctx.body = { error: `File size exceeds maximum allowed (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)` }
      return
    }

    // Validate MIME type from file buffer (magic bytes)
    let metadata
    try {
      metadata = await sharp(file.buffer).metadata()
    } catch (err) {
      ctx.status = 400
      ctx.body = { error: 'Invalid image file' }
      return
    }

    const detectedMime = `image/${metadata.format}`
    if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
      ctx.status = 400
      ctx.body = { error: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` }
      return
    }

    // Check image dimensions to prevent pixel bombs
    const maxDimension = getMaxDimension()
    if (metadata.width > maxDimension || metadata.height > maxDimension) {
      ctx.status = 400
      ctx.body = { error: `Image dimensions too large. Maximum ${maxDimension}x${maxDimension} pixels.` }
      return
    }

    try {
      // Re-encode image to strip EXIF metadata and validate it's a real image
      let processedBuffer
      if (metadata.format === 'gif') {
        // For GIFs, keep the original to preserve animation
        processedBuffer = file.buffer
      } else {
        processedBuffer = await sharp(file.buffer)
          .rotate() // Auto-rotate based on EXIF orientation before stripping
          .toFormat(metadata.format, { quality: 90 })
          .toBuffer()
      }

      // Get dimensions after processing
      const processedMetadata = await sharp(processedBuffer).metadata()

      // Compute content hash for deduplication
      const contentHash = hashContent(processedBuffer)
      const ext = MIME_TO_EXT[detectedMime] || metadata.format

      // Check if content already exists
      const [existingContent] = await dbPool('bm_web_document_contents')
        .where({ content_hash: contentHash })
        .select('content_hash', 'size', 'width', 'height')

      if (!existingContent) {
        // Content doesn't exist - write file and create content record
        const relativePath = getContentPath(contentHash, ext)
        const fullPath = path.join(UPLOAD_PATH, relativePath)
        const dir = path.dirname(fullPath)

        await ensureUploadDir(dir)
        await fs.writeFile(fullPath, processedBuffer)

        // Insert content record (use INSERT IGNORE for race condition safety)
        await dbPool.raw(
          `INSERT IGNORE INTO bm_web_document_contents 
           (content_hash, path, mime_type, size, width, height) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            contentHash,
            'uploads/documents/' + relativePath,
            detectedMime,
            processedBuffer.length,
            processedMetadata.width || null,
            processedMetadata.height || null
          ]
        )
      }

      // Create document record referencing the content
      const documentId = nanoid()
      await dbPool('bm_web_documents').insert({
        id: documentId,
        player_id: session.playerId,
        filename: file.originalname || `${documentId}.${ext}`,
        content_hash: contentHash,
        created: Math.floor(Date.now() / 1000)
      })

      ctx.status = 200
      ctx.body = {
        id: documentId,
        filename: file.originalname || `${documentId}.${ext}`,
        mimeType: detectedMime,
        size: existingContent ? existingContent.size : processedBuffer.length,
        width: existingContent ? existingContent.width : processedMetadata.width,
        height: existingContent ? existingContent.height : processedMetadata.height
      }
    } catch (err) {
      ctx.log.error(err, 'Failed to process upload')
      ctx.status = 500
      ctx.body = { error: 'Failed to process upload' }
    }
  }
}
