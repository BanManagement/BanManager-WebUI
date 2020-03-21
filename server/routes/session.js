const { verify } = require('../data/hash')
const { isEmail, isLength } = require('validator')
const { create } = require('../data/session')

module.exports = async function (ctx) {
  if (ctx.request.body.password) return handlePasswordLogin(ctx)

  return handlePinLogin(ctx)
}

async function handlePasswordLogin (ctx) {
  const { response, throw: throwError, request, state } = ctx

  if (typeof request.body.email !== 'string') return throwError(400, 'Invalid email type')
  if (!isEmail(request.body.email)) return throwError(400, 'Invalid email address')

  if (typeof request.body.password !== 'string') return throwError(400, 'Invalid password type')
  if (!isLength(request.body.password, { min: 6, max: 255 })) {
    return throwError(400, 'Invalid password, minimum length 6 characters')
  }

  const [[result]] = await state.dbPool.execute(
    'SELECT player_id AS playerId, password, updated FROM bm_web_users WHERE email = ?', [request.body.email])

  if (!result) return throwError(400, 'Incorrect login details')

  const match = await verify(result.password, request.body.password)

  if (!match) return throwError(400, 'Incorrect login details')

  ctx.session = create(result.playerId, result.updated, 'password')

  response.body = null
}

async function handlePinLogin (ctx) {
  const { response, throw: throwError, request, state } = ctx

  if (!/^[a-z0-9_]{2,16}$/i.test(request.body.name)) return throwError(400, 'Invalid name')

  if (typeof request.body.pin !== 'string') return throwError(400, 'Invalid pin type')
  if (!isLength(request.body.pin, { min: 6, max: 6 })) return throwError(400, 'Invalid pin, must be 6 characters')

  const server = state.serversPool.get(request.body.serverId)

  if (!server) return throwError(400, 'Server does not exist')

  const table = server.config.tables.playerPins
  const [[result]] = await server.execute(`
    SELECT
      pins.id AS id, p.id AS playerId, pins.pin AS pin
    FROM
      bm_players p
        RIGHT JOIN
      bm_player_pins pins ON pins.player_id = p.id
    WHERE
      p.name = ?
    LIMIT 1`, [request.body.name])

  if (!result) return throwError(400, 'Incorrect login details')

  const match = await verify(result.pin, request.body.pin)

  if (!match) return throwError(400, 'Incorrect login details')

  await server.execute(`DELETE FROM ${table} WHERE id = ?`, [result.id])

  const [[checkResult]] = await state.dbPool.execute(
    'SELECT updated FROM bm_web_users WHERE player_id = ?', [result.playerId])

  ctx.session = create(result.playerId, checkResult ? checkResult.updated : null, 'pin')

  response.body = { hasAccount: !!checkResult }
}
