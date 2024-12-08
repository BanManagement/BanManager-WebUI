const { generateExamplePayload } = require('../../../data/webhook')

module.exports = async function webhookExamplePayload (obj, { type }, { session, state }) {
  return generateExamplePayload(session, state, type)
}
