const ExposedError = require('../../../data/exposed-error')
const webhook = require('../queries/webhook')

module.exports = async function createWebhook (obj, { input }, { state }, info) {
  if (input.serverId) {
    const server = state.serversPool.get(input.serverId)

    if (!server) throw new ExposedError(`Server ${input.serverId} does not exist`)
  }

  const [id] = await state.dbPool('bm_web_webhooks').insert({
    url: input.url,
    type: input.type,
    template_type: input.templateType,
    content_type: input.contentType,
    content_template: input.contentTemplate,
    server_id: input.serverId,
    created: Date.now(),
    updated: Date.now()
  })

  return webhook(obj, { id }, { state }, info)
}
