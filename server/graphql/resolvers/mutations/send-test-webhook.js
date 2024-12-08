const webhook = require('../queries/webhook')
const { sendWebhook, fillTemplate } = require('../../../data/webhook')

module.exports = async function sendTestWebhook (obj, { id, variables }, { session, state }, info) {
  const data = await webhook(obj, { id }, { session, state }, info)

  if (!data) {
    throw new Error('Webhook not found')
  }

  const content = fillTemplate(data.contentTemplate, variables)
  const response = await sendWebhook(data, content)
  let body = ''
  const headers = Object.fromEntries([...response.headers])

  if (headers['content-type'] === 'application/json') {
    body = await response.json()
  }

  return {
    id: data.id,
    response: {
      status: response.status,
      statusText: response.statusText,
      headers,
      body
    },
    content,
    created: Math.floor(Date.now() / 1000)
  }
}
