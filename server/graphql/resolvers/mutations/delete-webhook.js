const ExposedError = require('../../../data/exposed-error')
const webhook = require('../queries/webhook')

module.exports = async function deleteWebhook (obj, { id }, { state }, info) {
  const data = await webhook(obj, { id }, { state }, info)

  if (!data) throw new ExposedError(`Webhook ${id} does not exist`)

  await state.dbPool('bm_web_webhooks')
    .where({ id })
    .del()

  return data
}
