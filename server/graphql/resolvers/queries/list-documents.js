const { unparse } = require('uuid-parse')

module.exports = async function listDocuments (obj, { limit, offset, player, dateStart, dateEnd }, { state }) {
  let query = state.dbPool('bm_web_documents as d')
    .join('bm_web_document_contents as c', 'd.content_hash', 'c.content_hash')
    .select(
      'd.id',
      'd.player_id',
      'd.filename',
      'd.created',
      'c.path',
      'c.mime_type',
      'c.size',
      'c.width',
      'c.height'
    )
    .orderBy('d.created', 'desc')

  let countQuery = state.dbPool('bm_web_documents as d')
    .join('bm_web_document_contents as c', 'd.content_hash', 'c.content_hash')

  if (player) {
    // player is already a Buffer from the UUID scalar parseValue
    query = query.where('d.player_id', player)
    countQuery = countQuery.where('d.player_id', player)
  }

  if (dateStart) {
    query = query.where('d.created', '>=', dateStart)
    countQuery = countQuery.where('d.created', '>=', dateStart)
  }

  if (dateEnd) {
    query = query.where('d.created', '<=', dateEnd)
    countQuery = countQuery.where('d.created', '<=', dateEnd)
  }

  const [{ total }] = await countQuery.count('* as total')
  const records = await query.limit(limit).offset(offset)

  return {
    total,
    records: records.map(record => ({
      ...record,
      playerId: unparse(record.player_id),
      mimeType: record.mime_type
    }))
  }
}
