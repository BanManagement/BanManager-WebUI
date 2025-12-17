const path = require('path')
const fs = require('fs').promises

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads/documents'
const CLEANUP_AGE_HOURS = parseInt(process.env.DOCUMENT_CLEANUP_AGE_HOURS || '24', 10)

async function cleanupOrphanDocuments (dbPool, logger) {
  try {
    const cutoffTime = Math.floor(Date.now() / 1000) - (CLEANUP_AGE_HOURS * 60 * 60)

    // Find orphan documents: not linked to any appeal or report comment, older than cutoff
    const orphanDocuments = await dbPool('bm_web_documents as d')
      .leftJoin('bm_web_appeal_documents as ad', 'd.id', 'ad.document_id')
      .leftJoin('bm_web_report_comment_documents as rcd', 'd.id', 'rcd.document_id')
      .whereNull('ad.document_id')
      .whereNull('rcd.document_id')
      .where('d.created', '<', cutoffTime)
      .select('d.id', 'd.content_hash')

    if (orphanDocuments.length === 0) {
      return
    }

    logger.info(`Cleaning up ${orphanDocuments.length} orphan document(s)`)

    // Collect content hashes before deleting documents
    const contentHashes = [...new Set(orphanDocuments.map(d => d.content_hash))]

    // Delete orphan document records
    const orphanIds = orphanDocuments.map(d => d.id)
    await dbPool('bm_web_documents').whereIn('id', orphanIds).del()

    // Check which content records are now orphaned (no remaining document references)
    for (const contentHash of contentHashes) {
      const [{ count }] = await dbPool('bm_web_documents')
        .where({ content_hash: contentHash })
        .count('* as count')

      if (count === 0) {
        // Content has no more references - delete file and content record
        const [content] = await dbPool('bm_web_document_contents')
          .where({ content_hash: contentHash })
          .select('path')

        if (content) {
          const relativePath = content.path.replace('uploads/documents/', '').split('/').join(path.sep)
          const fullPath = path.join(UPLOAD_PATH, relativePath)

          try {
            await fs.unlink(fullPath)
          } catch (err) {
            if (err.code !== 'ENOENT') {
              logger.warn({ err, path: fullPath }, 'Failed to delete orphan document file')
            }
          }

          await dbPool('bm_web_document_contents')
            .where({ content_hash: contentHash })
            .del()
        }
      }
    }

    logger.info(`Cleaned up ${orphanDocuments.length} orphan document(s)`)
  } catch (err) {
    logger.error({ err }, 'Failed to cleanup orphan documents')
  }
}

module.exports = { cleanupOrphanDocuments }
