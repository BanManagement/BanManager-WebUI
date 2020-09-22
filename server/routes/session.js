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

  const result = await state.dbPool('bm_web_users')
    .select('player_id', 'password', 'updated')
    .where('email', request.body.email)
    .first()

  if (!result) return throwError(400, 'Incorrect login details')

  const match = await verify(result.password, request.body.password)

  if (!match) return throwError(400, 'Incorrect login details')

  ctx.session = create(result.player_id, result.updated, 'password')
  await ctx.session.manuallyCommit()

  response.body = null
}

async function handlePinLogin (ctx) {
  const { response, throw: throwError, request, state } = ctx

  if (!/^[a-z0-9_]{2,16}$/i.test(request.body.name)) return throwError(400, 'Invalid name')

  if (typeof request.body.pin !== 'string') return throwError(400, 'Invalid pin type')
  if (!isLength(request.body.pin, { min: 6, max: 6 })) return throwError(400, 'Invalid pin, must be 6 characters')

  const server = state.serversPool.get(request.body.serverId)

  if (!server) return throwError(400, 'Server does not exist')

  const { playerPins, players } = server.config.tables
  const results = await server.pool(players + ' AS p')
    .select('pins.id AS id', 'p.id AS playerId', 'pins.pin AS pin')
    .rightJoin(playerPins + ' AS pins', 'pins.player_id', 'p.id')
    .where('p.name', request.body.name)
    .andWhere('pins.expires', '>', server.pool.raw('UNIX_TIMESTAMP()'))

  if (!results) return throwError(400, 'Incorrect login details')

  let matchedPin = null

  for (const result of results) {
    const match = await verify(result.pin, request.body.pin)

    if (match) {
      matchedPin = result
      break
    }
  }

  if (!matchedPin) return throwError(400, 'Incorrect login details')

  await server.pool(playerPins)
    .where('id', matchedPin.id)
    .del()

  const checkResult = await state.dbPool('bm_web_users')
    .select('updated')
    .where('player_id', matchedPin.playerId)
    .first()

  ctx.session = create(matchedPin.playerId, checkResult ? checkResult.updated : null, 'pin')
  await ctx.session.manuallyCommit()

  response.body = { hasAccount: !!checkResult }
}
