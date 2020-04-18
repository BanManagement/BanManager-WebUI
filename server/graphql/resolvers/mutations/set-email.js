const { verify } = require('../../../data/hash')
const { isLength, isEmail } = require('validator')
const ExposedError = require('../../../data/exposed-error')
const Me = require('../queries/me')

module.exports = async function setEmail (obj, { currentPassword, email }, { session, state }) {
  if (!isLength(currentPassword, { min: 6, max: 255 })) {
    throw new ExposedError('Invalid password, minimum length 6 characters')
  }

  if (!isEmail(email)) throw new ExposedError('Invalid email address')

  const [checkResult] = await state.dbPool('bm_web_users')
    .select('player_id', 'password')
    .where('player_id', session.playerId)

  if (!checkResult) throw new ExposedError('You do not have an account, please register')

  const match = await verify(checkResult.password, currentPassword)

  if (!match) throw new ExposedError('Incorrect login details')

  const [emailResult] = await state.dbPool('bm_web_users')
    .select('email')
    .where('email', email)

  if (emailResult) throw new ExposedError('You already have an account')

  await state.dbPool('bm_web_users')
    .update('email', email)
    .where('player_id', session.playerId)

  return Me(obj, {}, { session, state })
}
