const path = require('path')
const send = require('koa-send')

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads/documents'

module.exports = function documentsRoute (dbPool) {
  return async (ctx) => {
    const { id } = ctx.params
    const { acl } = ctx.state

    // Look up document with content join
    const [document] = await dbPool('bm_web_documents as d')
      .join('bm_web_document_contents as c', 'd.content_hash', 'c.content_hash')
      .where('d.id', id)
      .select('d.id', 'c.path', 'c.mime_type')

    if (!document) {
      ctx.status = 404
      ctx.body = { error: 'Document not found' }
      return
    }

    // Check if document is attached to an appeal (directly or via comment)
    const [appealDoc] = await dbPool('bm_web_appeal_documents')
      .where({ document_id: id })
      .select('appeal_id', 'comment_id')

    if (appealDoc) {
      // Get appeal to check permissions
      const [appeal] = await dbPool('bm_web_appeals')
        .where({ id: appealDoc.appeal_id })
        .select('actor_id', 'assignee_id', 'server_id')

      if (!appeal) {
        ctx.status = 404
        ctx.body = { error: 'Parent appeal not found' }
        return
      }

      // Check attachment.view permission
      const canViewAttachments = acl.hasServerPermission(appeal.server_id, 'player.appeals', 'attachment.view')
      if (!canViewAttachments) {
        ctx.status = 403
        ctx.body = { error: 'You do not have permission to view attachments' }
        return
      }

      // Check view permission on parent appeal
      const canViewAny = acl.hasServerPermission(appeal.server_id, 'player.appeals', 'view.any')
      const canViewOwn = acl.hasServerPermission(appeal.server_id, 'player.appeals', 'view.own') && acl.owns(appeal.actor_id)
      const canViewAssigned = acl.hasServerPermission(appeal.server_id, 'player.appeals', 'view.assigned') && acl.owns(appeal.assignee_id)

      if (!canViewAny && !canViewOwn && !canViewAssigned) {
        ctx.status = 403
        ctx.body = { error: 'You do not have permission to view this document' }
        return
      }

      // If attached to a comment, also check view.comments permission
      if (appealDoc.comment_id !== 0) {
        const canViewComments = acl.hasServerPermission(appeal.server_id, 'player.appeals', 'view.comments')
        if (!canViewComments) {
          ctx.status = 403
          ctx.body = { error: 'You do not have permission to view this document' }
          return
        }
      }
    } else {
      // Check if document is attached to a report comment
      const [reportCommentDoc] = await dbPool('bm_web_report_comment_documents')
        .where({ document_id: id })
        .select('server_id', 'comment_id')

      if (reportCommentDoc) {
        // Check attachment.view permission
        const canViewAttachments = acl.hasServerPermission(reportCommentDoc.server_id, 'player.reports', 'attachment.view')
        if (!canViewAttachments) {
          ctx.status = 403
          ctx.body = { error: 'You do not have permission to view attachments' }
          return
        }

        // Check view.comments permission
        const canViewComments = acl.hasServerPermission(reportCommentDoc.server_id, 'player.reports', 'view.comments')
        if (!canViewComments) {
          ctx.status = 403
          ctx.body = { error: 'You do not have permission to view this document' }
          return
        }
      } else {
        // Document not linked to anything - only admins can view unlinked documents
        const canManage = acl.hasPermission('servers', 'manage')
        if (!canManage) {
          ctx.status = 403
          ctx.body = { error: 'You do not have permission to view this document' }
          return
        }
      }
    }

    // Serve the file - convert stored forward slashes to platform-specific separator
    const relativePath = document.path.replace('uploads/documents/', '').split('/').join(path.sep)

    try {
      // Security headers for user-uploaded content
      ctx.set('Cache-Control', 'private, max-age=86400')
      ctx.set('Content-Type', document.mime_type)
      ctx.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
      ctx.set('X-Content-Type-Options', 'nosniff')
      ctx.set('X-Frame-Options', 'DENY')
      ctx.set('Content-Disposition', 'inline')

      await send(ctx, relativePath, { root: UPLOAD_PATH })
    } catch (err) {
      if (err.status === 404) {
        ctx.status = 404
        ctx.body = { error: 'Document file not found' }
      } else {
        ctx.log.error(err, 'Failed to serve document')
        ctx.status = 500
        ctx.body = { error: 'Failed to serve document' }
      }
    }
  }
}
