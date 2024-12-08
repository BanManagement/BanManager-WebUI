
const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const { generateExamplePayload } = require('../../../data/webhook')

module.exports = async function listWebhooks (obj, { limit, offset }, { session, state }, info) {
  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, {
    pool: state.dbPool,
    config: {
      tables: {
        webhooks: 'bm_web_webhooks'
      }
    }
  }, fields, 'webhooks').limit(limit).offset(offset)
  const { total } = await state.dbPool('bm_web_webhooks')
    .select(state.dbPool.raw('COUNT(*) as total'))
    .first()
  const records = await query.exec()

  return {
    total,
    records: Promise.all(records.map(async record => ({
      ...record,
      examplePayload: await generateExamplePayload(session, state, record.type),
      contentType: record.content_type,
      contentTemplate: record.content_template,
      templateType: record.template_type,
      server: state.serversPool.get(record.server_id)?.config
    })))
  }
}
