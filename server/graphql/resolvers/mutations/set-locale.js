const ExposedError = require('../../../data/exposed-error')
const { isSupportedLocale } = require('../../../data/locales')
const Me = require('../queries/me')

module.exports = async function setLocale (obj, { locale }, { session, state, log }) {
  if (!isSupportedLocale(locale)) {
    throw new ExposedError('Locale is not supported', 'INVALID_LOCALE')
  }

  await state.dbPool('bm_web_users')
    .update('locale', locale)
    .where('player_id', session.playerId)

  return Me(obj, {}, { session, state, log })
}
