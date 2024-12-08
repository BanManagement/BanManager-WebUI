const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')

module.exports = async function listWebhookDeliveries (obj, { webhookId, limit, offset }, { state }, info) {
  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, {
    pool: state.dbPool,
    config: {
      tables: {
        webhooks: 'bm_web_webhooks',
        webhookDeliveries: 'bm_web_webhook_deliveries'
      }
    }
  }, fields, 'webhookDeliveries')
    .where('webhook_id', webhookId)
    .limit(limit)
    .offset(offset)
    .orderBy('created', 'desc')
  const { total } = await state.dbPool('bm_web_webhook_deliveries')
    .select(state.dbPool.raw('COUNT(*) as total'))
    .where('webhook_id', webhookId)
    .first()
  const records = await query.exec()

  return { total, records }
}
