const { hash } = require('../data/hash')
const { isEmail, isLength } = require('validator')
const { pwnedPassword } = require('hibp')

// eslint-disable-next-line complexity
module.exports = async function ({ log, request: { body }, throw: throwError, response, session, state }) {
  if (!session || !session.playerId) return throwError(400, 'You are not logged in')

  if (typeof body.email !== 'string') return throwError(400, 'Invalid email type')
  if (!isEmail(body.email)) return throwError(400, 'Invalid email address')

  if (typeof body.password !== 'string') return throwError(400, 'Invalid password type')
  if (!isLength(body.password, { min: 6, max: 255 })) {
    return throwError(400, 'Invalid password, minimum length 6 characters')
  }

  if (await pwnedPassword(body.password) > 5) {
    return throwError(400, 'Commonly used password, please choose another')
  }

  const [[checkResult]] = await state.dbPool.execute(
    'SELECT player_id FROM bm_web_users WHERE player_id = ?', [session.playerId])

  if (checkResult) return throwError(400, 'You already have an account')

  const [[emailResult]] = await state.dbPool.execute(
    'SELECT email FROM bm_web_users WHERE email = ?', [body.email])

  if (emailResult) return throwError(400, 'You already have an account')

  const encodedHash = await hash(body.password)
  const conn = await state.dbPool.getConnection()

  try {
    await conn.beginTransaction()

    await conn.execute(
      'INSERT INTO bm_web_users (player_id, email, password, updated) VALUES(?, ?, ?, UNIX_TIMESTAMP())',
      [session.playerId, body.email, encodedHash])

    await conn.execute(
      'INSERT INTO bm_web_player_roles (player_id, role_id) VALUES(?, ?)', [session.playerId, 2])

    await conn.commit()
  } catch (e) {
    log.error(e)

    if (!conn.connection._fatalError) {
      await conn.rollback()
    }
  } finally {
    conn.release()
  }

  response.body = null
}
