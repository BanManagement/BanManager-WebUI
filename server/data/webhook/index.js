const fillTemplate = require('es6-dynamic-template')
const ExposedError = require('../exposed-error')
const { unparse } = require('uuid-parse')

async function sendWebhook (webhook, content) {
  const url = webhook.url

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: webhook.contentType === 'APPLICATION_JSON' ? 'application/json' : 'application/x-www-form-urlencoded',
      'Content-Type': webhook.contentType === 'APPLICATION_JSON' ? 'application/json' : 'application/x-www-form-urlencoded'
    },
    body: content
  })

  return response
}

async function triggerWebhook (log, state, type, variables) {
  const webhooks = await state.dbPool('bm_web_webhooks').where('type', type)
  const records = webhooks.map(record => ({
    ...record,
    contentType: record.content_type,
    contentTemplate: record.content_template,
    templateType: record.template_type
  }))

  for (const webhook of records) {
    const content = fillTemplate(webhook.contentTemplate, variables)

    try {
      const response = await sendWebhook(webhook, content)

      let body = ''
      const headers = Object.fromEntries([...response.headers])

      if (headers['content-type'] === 'application/json') {
        body = await response.json()
      }

      await state.dbPool('bm_web_webhook_deliveries').insert({
        webhook_id: webhook.id,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers,
          body
        },
        content,
        created: state.dbPool.raw('UNIX_TIMESTAMP()')
      })
    } catch (error) {
      log.error(error)

      await state.dbPool('bm_web_webhook_deliveries').insert({
        webhook_id: webhook.id,
        response: {},
        content,
        error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        created: state.dbPool.raw('UNIX_TIMESTAMP()')
      })
    }
  }
}

const examplePayloads = {
  APPEAL_CREATED: {
    appealId: 1,
    actorId: 'ae51c849-3f2a-4a37-986d-55ed5b02307f',
    actorName: 'confuser'
  }
}

const generateExamplePayload = async (session, state, type) => {
  const examplePayload = examplePayloads[type]

  if (!examplePayload) {
    throw new ExposedError(`No example payload found for type ${type}`)
  }

  if (examplePayload.actorId) {
    const actor = await state.loaders.player.load({ id: session.playerId, fields: ['name'] })

    examplePayload.actorId = unparse(actor.id)
    examplePayload.actorName = actor.name
  }

  return examplePayload
}

module.exports = {
  examplePayloads,
  fillTemplate,
  generateExamplePayload,
  sendWebhook,
  triggerWebhook
}
