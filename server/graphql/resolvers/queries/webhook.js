
const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const { generateExamplePayload } = require('../../../data/webhook')

module.exports = async function webhook (obj, { id }, { session, state }, info) {
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)
  const [data] = await state.dbPool('bm_web_webhooks').where('id', id)

  if (!data || !data.id) return data

  if (fields.server && data.server_id) {
    const server = state.serversPool.get(data.server_id)

    data.server = server.config
  }

  if (fields.examplePayload) {
    data.examplePayload = await generateExamplePayload(session, state, data.type)
  }

  return {
    ...data,
    contentType: data.content_type,
    contentTemplate: data.content_template,
    templateType: data.template_type
  }
}
