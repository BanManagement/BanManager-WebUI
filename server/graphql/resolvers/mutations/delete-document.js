const fs = require('fs').promises
const path = require('path')
const { unparse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads/documents'

async function getDocumentContext (dbPool, documentId) {
  // Check if attached to an appeal (either directly or via comment)
  const [appealDoc] = await dbPool('bm_web_appeal_documents')
    .where({ document_id: documentId })
    .select('appeal_id')

  if (appealDoc) {
    const [appeal] = await dbPool('bm_web_appeals')
      .where({ id: appealDoc.appeal_id })
      .select('server_id')

    if (!appeal) throw new ExposedError('Parent appeal not found')
    return { serverId: appeal.server_id, resource: 'player.appeals' }
  }

  // Check if attached to a report comment
  const [reportCommentDoc] = await dbPool('bm_web_report_comment_documents')
    .where({ document_id: documentId })
    .select('server_id')

  if (reportCommentDoc) {
    return { serverId: reportCommentDoc.server_id, resource: 'player.reports' }
  }

  return null
}

module.exports = async function deleteDocument (obj, { id }, { log, session, state }) {
  // Join documents with contents to get all fields
  const [document] = await state.dbPool('bm_web_documents as d')
    .join('bm_web_document_contents as c', 'd.content_hash', 'c.content_hash')
    .where('d.id', id)
    .select(
      'd.id',
      'd.player_id',
      'd.filename',
      'd.content_hash',
      'd.created',
      'c.path',
      'c.mime_type',
      'c.size',
      'c.width',
      'c.height'
    )

  if (!document) {
    throw new ExposedError(`Document ${id} does not exist`)
  }

  const playerId = unparse(document.player_id)
  const isOwner = session.playerId && unparse(session.playerId) === playerId
  const context = await getDocumentContext(state.dbPool, id)

  if (context) {
    const { serverId, resource } = context
    const canDeleteAny = state.acl.hasServerPermission(serverId, resource, 'attachment.delete.any')
    const canDeleteOwn = state.acl.hasServerPermission(serverId, resource, 'attachment.delete.own') && isOwner

    if (!canDeleteAny && !canDeleteOwn) {
      throw new ExposedError('You do not have permission to delete this document')
    }
  } else {
    // Unlinked document - only admins can delete
    if (!state.acl.hasPermission('servers', 'manage')) {
      throw new ExposedError('You do not have permission to delete this document')
    }
  }

  const contentHash = document.content_hash

  // Delete document record - junction tables cascade automatically
  await state.dbPool('bm_web_documents').where({ id }).delete()

  // Check if any other documents still reference this content
  const [{ count }] = await state.dbPool('bm_web_documents')
    .where({ content_hash: contentHash })
    .count('* as count')

  if (count === 0) {
    // No more references - delete content record and file
    const relativePath = document.path.replace('uploads/documents/', '').split('/').join(path.sep)
    const fullPath = path.join(UPLOAD_PATH, relativePath)

    try {
      await fs.unlink(fullPath)
    } catch (err) {
      if (err.code !== 'ENOENT') {
        log.error({ err, path: fullPath }, 'Failed to delete document file')
      }
    }

    await state.dbPool('bm_web_document_contents')
      .where({ content_hash: contentHash })
      .delete()
  }

  return {
    id: document.id,
    filename: document.filename,
    mimeType: document.mime_type,
    size: document.size,
    width: document.width,
    height: document.height,
    created: document.created,
    acl: { delete: true }
  }
}
