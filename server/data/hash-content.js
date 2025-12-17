const crypto = require('crypto')

/**
 * Computes SHA-256 hash of a buffer and returns it as a hex string.
 * Used for content-addressable storage deduplication.
 * @param {Buffer} buffer - The buffer to hash
 * @returns {string} 64-character hex string
 */
function hashContent (buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Generates a content-addressed file path from a hash.
 * Uses first 4 characters as subdirectories to distribute files.
 * @param {string} contentHash - 64-character SHA-256 hex string
 * @param {string} extension - File extension (e.g., 'jpg', 'png')
 * @returns {string} Path like 'ab/cd/abcdef...hash.jpg'
 */
function getContentPath (contentHash, extension) {
  const dir1 = contentHash.slice(0, 2)
  const dir2 = contentHash.slice(2, 4)
  return `${dir1}/${dir2}/${contentHash}.${extension}`
}

module.exports = { hashContent, getContentPath }
