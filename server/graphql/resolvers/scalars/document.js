const { unparse } = require('uuid-parse')

// Helper to fetch documents by IDs with content join
async function getDocumentsWithContent (dbPool, documentIds) {
  if (!documentIds.length) return []

  const documents = await dbPool('bm_web_documents as d')
    .join('bm_web_document_contents as c', 'd.content_hash', 'c.content_hash')
    .whereIn('d.id', documentIds)
    .select(
      'd.id',
      'd.player_id',
      'd.filename',
      'd.created',
      'c.mime_type',
      'c.size',
      'c.width',
      'c.height'
    )

  return documents.map(doc => ({
    ...doc,
    playerId: unparse(doc.player_id),
    mimeType: doc.mime_type
  }))
}

module.exports = {
  Document: {
    player: {
      async resolve (obj, args, { state }, info) {
        const playerId = obj.player_id || obj.playerId
        if (!playerId) return null

        try {
          return await state.loaders.player.load({ id: playerId, fields: ['id', 'name'] })
        } catch (e) {
          return { id: typeof playerId === 'string' ? playerId : unparse(playerId) }
        }
      }
    },
    usages: {
      async resolve (obj, args, { state }) {
        const documentId = obj.id
        const usages = []

        // Check appeal documents (both initial appeal and comments)
        const appealLinks = await state.dbPool('bm_web_appeal_documents as ad')
          .join('bm_web_appeals as a', 'ad.appeal_id', 'a.id')
          .where('ad.document_id', documentId)
          .select('a.id as appeal_id', 'a.server_id', 'ad.comment_id')

        for (const link of appealLinks) {
          if (link.comment_id === 0) {
            usages.push({
              type: 'appeal',
              id: String(link.appeal_id),
              commentId: null,
              serverId: link.server_id,
              label: `Appeal #${link.appeal_id}`
            })
          } else {
            usages.push({
              type: 'appeal_comment',
              id: String(link.appeal_id),
              commentId: String(link.comment_id),
              serverId: link.server_id,
              label: `Appeal #${link.appeal_id} Comment`
            })
          }
        }

        // Check report comment documents - need to look up report_id from the comment
        const reportLinks = await state.dbPool('bm_web_report_comment_documents')
          .where({ document_id: documentId })
          .select('server_id', 'comment_id')

        for (const link of reportLinks) {
          // Get report_id from the comment on the appropriate server
          const server = state.serversPool.get(link.server_id)
          if (!server) continue

          const [comment] = await server.pool(server.config.tables.playerReportComments)
            .where({ id: link.comment_id })
            .select('report_id')

          if (!comment) continue

          usages.push({
            type: 'report_comment',
            id: String(comment.report_id),
            commentId: String(link.comment_id),
            serverId: link.server_id,
            label: `Report #${comment.report_id} Comment`
          })
        }

        return usages
      }
    },
    acl: {
      resolve (obj, args, { session, state }) {
        const playerId = obj.player_id || obj.playerId
        const playerIdStr = typeof playerId === 'string' ? playerId : unparse(playerId)
        const isOwner = session.playerId && unparse(session.playerId) === playerIdStr

        // Check delete permissions - we'll need to know which resource it belongs to
        const canDeleteAnyAppeals = state.acl.hasPermission('player.appeals', 'attachment.delete.any')
        const canDeleteOwnAppeals = state.acl.hasPermission('player.appeals', 'attachment.delete.own') && isOwner
        const canDeleteAnyReports = state.acl.hasPermission('player.reports', 'attachment.delete.any')
        const canDeleteOwnReports = state.acl.hasPermission('player.reports', 'attachment.delete.own') && isOwner
        const canManage = state.acl.hasPermission('servers', 'manage')

        return {
          delete: canDeleteAnyAppeals || canDeleteOwnAppeals || canDeleteAnyReports || canDeleteOwnReports || canManage
        }
      }
    }
  },

  PlayerAppeal: {
    documents: {
      async resolve (obj, args, { state }) {
        const appealId = obj.id
        const serverId = obj.server_id

        const canViewAttachments = state.acl.hasServerPermission(serverId, 'player.appeals', 'attachment.view')
        if (!canViewAttachments) return []

        const documentLinks = await state.dbPool('bm_web_appeal_documents')
          .where({ appeal_id: appealId })
          .select('document_id')

        const documentIds = documentLinks.map(link => link.document_id)
        return getDocumentsWithContent(state.dbPool, documentIds)
      }
    },
    initialDocuments: {
      async resolve (obj, args, { state }) {
        const appealId = obj.id
        const serverId = obj.server_id

        const canViewAttachments = state.acl.hasServerPermission(serverId, 'player.appeals', 'attachment.view')
        if (!canViewAttachments) return []

        const documentLinks = await state.dbPool('bm_web_appeal_documents')
          .where({ appeal_id: appealId, comment_id: 0 })
          .select('document_id')

        const documentIds = documentLinks.map(link => link.document_id)
        return getDocumentsWithContent(state.dbPool, documentIds)
      }
    }
  },

  PlayerAppealComment: {
    documents: {
      async resolve (obj, args, { state }) {
        const commentId = obj.id

        const [comment] = await state.dbPool('bm_web_appeal_comments')
          .where({ id: commentId })
          .select('appeal_id')

        if (!comment) return []

        const [appeal] = await state.dbPool('bm_web_appeals')
          .where({ id: comment.appeal_id })
          .select('server_id')

        if (!appeal) return []

        const canViewAttachments = state.acl.hasServerPermission(appeal.server_id, 'player.appeals', 'attachment.view')
        if (!canViewAttachments) return []

        const documentLinks = await state.dbPool('bm_web_appeal_documents')
          .where({ appeal_id: comment.appeal_id, comment_id: commentId })
          .select('document_id')

        const documentIds = documentLinks.map(link => link.document_id)
        return getDocumentsWithContent(state.dbPool, documentIds)
      }
    }
  },

  PlayerReport: {
    documents: {
      async resolve (obj, args, { state }) {
        const reportId = obj.id
        const serverId = obj.serverId || obj.server_id

        if (!serverId) return []

        const canViewAttachments = state.acl.hasServerPermission(serverId, 'player.reports', 'attachment.view')
        if (!canViewAttachments) return []

        const server = state.serversPool.get(serverId)
        if (!server) return []

        const commentIds = await server.pool(server.config.tables.playerReportComments)
          .where({ report_id: reportId })
          .select('id')

        if (!commentIds.length) return []

        const documentLinks = await state.dbPool('bm_web_report_comment_documents')
          .where({ server_id: serverId })
          .whereIn('comment_id', commentIds.map(c => c.id))
          .select('document_id')

        const documentIds = documentLinks.map(link => link.document_id)
        return getDocumentsWithContent(state.dbPool, documentIds)
      }
    }
  },

  PlayerReportComment: {
    documents: {
      async resolve (obj, args, { state }) {
        const commentId = obj.id
        const serverId = obj.serverId || obj.server_id

        if (!serverId) return []

        const canViewAttachments = state.acl.hasServerPermission(serverId, 'player.reports', 'attachment.view')
        if (!canViewAttachments) return []

        const documentLinks = await state.dbPool('bm_web_report_comment_documents')
          .where({ server_id: serverId, comment_id: commentId })
          .select('document_id')

        const documentIds = documentLinks.map(link => link.document_id)
        return getDocumentsWithContent(state.dbPool, documentIds)
      }
    }
  }
}
