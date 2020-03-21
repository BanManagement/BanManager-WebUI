const ExposedError = require('../../../data/exposed-error')

module.exports = async function me (obj, info, { session, state }) {
  if (!session || !session.playerId) throw new ExposedError('Invalid session')

  const [[checkResult]] = await state.dbPool.execute(
    'SELECT email FROM bm_web_users WHERE player_id = ?', [session.playerId])

  const me = {
    ...await state.loaders.player.ids.load(session.playerId),
    hasAccount: !!checkResult,
    email: checkResult ? checkResult.email : null,
    session: {
      type: session.type
    }
  }

  return me
}
