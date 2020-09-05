const ExposedError = require('../../../data/exposed-error')

module.exports = async function me (obj, info, { session, state }) {
  if (!session || !session.playerId) throw new ExposedError('Invalid session')

  const [checkResult] = await state.dbPool('bm_web_users').select('email').where('player_id', session.playerId)

  const me = {
    ...await state.loaders.player.load({ id: session.playerId, fields: ['id', 'name'] }),
    hasAccount: !!checkResult,
    email: checkResult ? checkResult.email : null,
    session: {
      type: session.type
    }
  }

  return me
}
