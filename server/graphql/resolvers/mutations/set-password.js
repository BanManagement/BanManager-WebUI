const { pwnedPassword } = require('hibp')
const { hash, verify } = require('../../../data/hash')
const { isLength } = require('validator')
const ExposedError = require('../../../data/exposed-error')
const Me = require('../queries/me')

module.exports = async function setPassword (obj, { currentPassword, newPassword }, { log, session, state }) {
  if (!isLength(newPassword, { min: 6, max: 255 })) {
    throw new ExposedError('Invalid password, minimum length 6 characters')
  }

  const [checkResult] = await state.dbPool('bm_web_users')
    .select('player_id', 'password')
    .where('player_id', session.playerId)

  if (!checkResult) throw new ExposedError('You do not have an account, please register')

  // Only expect current password if player did not login via pin
  // as pin is 'forgot password' journey
  if (session.type !== 'pin') {
    if (!currentPassword || !isLength(currentPassword, { min: 6, max: 255 })) {
      throw new ExposedError('Invalid password, minimum length 6 characters')
    }

    const match = await verify(checkResult.password, currentPassword)

    if (!match) throw new ExposedError('Incorrect login details')
  }

  let commonPassword = false

  try {
    commonPassword = await pwnedPassword(newPassword) > 5
  } catch (e) {
    log.error(e, 'hibp failure')
  }

  if (commonPassword) {
    throw new ExposedError('Commonly used password, please choose another')
  }

  const encodedHash = await hash(newPassword)

  session.updated = Math.floor(Date.now() / 1000)

  await session.manuallyCommit()

  await state.dbPool('bm_web_users')
    .update({
      password: encodedHash,
      updated: session.updated
    })
    .where('player_id', session.playerId)

  return Me(obj, {}, { session, state })
}
