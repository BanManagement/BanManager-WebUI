const { hash } = require('../data/hash')
const { isEmail, isLength } = require('validator')
const { pwnedPassword } = require('hibp')

// eslint-disable-next-line complexity
module.exports = async function ({ request: { body }, throw: throwError, response, session, state }) {
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

  const checkResult = await state.dbPool('bm_web_users')
    .select('email')
    .where('player_id', session.playerId)
    .first()

  if (checkResult && checkResult.email) return throwError(400, 'You already have an account')

  const [emailResult] = await state.dbPool('bm_web_users')
    .select('email')
    .where('email', body.email)

  if (emailResult) return throwError(400, 'You already have an account')

  const encodedHash = await hash(body.password)

  await state.dbPool.transaction(async trx => {
    await trx('bm_web_users')
      .insert({
        player_id: session.playerId,
        email: body.email,
        password: encodedHash,
        updated: trx.raw('UNIX_TIMESTAMP()')
      })
      .onDuplicateUpdate('email', 'password', 'updated')

    await trx('bm_web_player_roles').insert({
      player_id: session.playerId,
      role_id: 2
    })

    await trx.commit()
  })

  response.body = null
}
