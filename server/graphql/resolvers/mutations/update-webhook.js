const ExposedError = require('../../../data/exposed-error')
const webhook = require('../queries/webhook')

module.exports = async function updateWebhook (obj, { id, input }, { state }, info) {
  const data = await webhook(obj, { id }, { state }, info)

  if (!data) throw new ExposedError(`Webhook ${id} does not exist`)

  if (input.serverId) {
    const server = state.serversPool.get(input.serverId)

    if (!server) throw new ExposedError(`Server ${input.serverId} does not exist`)
  }

  await state.dbPool('bm_web_webhooks')
    .where({ id })
    .update({
      url: input.url,
      type: input.type,
      template_type: input.templateType,
      content_type: input.contentType,
      content_template: input.contentTemplate,
      server_id: input.serverId,
      updated: Date.now()
    })

  return webhook(obj, { id }, { state }, info)
}
