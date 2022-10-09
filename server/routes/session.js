const requestIp = require('request-ip')
const { RateLimiterMySQL } = require('rate-limiter-flexible')
const { verify } = require('../data/hash')
const { isEmail, isLength } = require('validator')
const { create } = require('../data/session')

const maxWrongAttemptsByIPperDay = 100
const maxConsecutiveFailsByUsernameAndIP = 10

const getUsernameIPkey = (username, ip) => `${username.toLowerCase()}_${ip}`

module.exports = (dbPool) => {
  const limiterSlowBruteByIP = new RateLimiterMySQL({
    storeType: 'knex',
    storeClient: dbPool,
    dbName: dbPool.client.config.connection.database,
    tableName: 'bm_web_rate_limits',
    tableCreated: true,
    keyPrefix: 'login_fail_ip',
    points: maxWrongAttemptsByIPperDay,
    duration: 60 * 60 * 24,
    blockDuration: 60 * 60 * 24 // Block for 1 day, if 100 wrong attempts per day
  })

  const limiterConsecutiveFailsByUsernameAndIP = new RateLimiterMySQL({
    storeType: 'knex',
    storeClient: dbPool,
    dbName: dbPool.client.config.connection.database,
    tableName: 'bm_web_rate_limits',
    tableCreated: true,
    keyPrefix: 'login_fail_consecutive_username_and_ip',
    points: maxConsecutiveFailsByUsernameAndIP,
    duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
    blockDuration: 60 * 60 // Block for 1 hour
  })

  return async function (ctx) {
    if (ctx.request.body.password) {
      return handlePasswordLogin(ctx, { limiterSlowBruteByIP, limiterConsecutiveFailsByUsernameAndIP })
    } else {
      return handlePinLogin(ctx, { limiterSlowBruteByIP, limiterConsecutiveFailsByUsernameAndIP })
    }
  }
}

async function handlePasswordLogin (ctx, { limiterSlowBruteByIP, limiterConsecutiveFailsByUsernameAndIP }) {
  const { response, throw: throwError, request, state } = ctx

  if (typeof request.body.email !== 'string') return throwError(400, 'Invalid email type')
  if (!isEmail(request.body.email)) return throwError(400, 'Invalid email address')

  if (typeof request.body.password !== 'string') return throwError(400, 'Invalid password type')
  if (!isLength(request.body.password, { min: 6, max: 255 })) {
    return throwError(400, 'Invalid password, minimum length 6 characters')
  }

  const ipAddr = requestIp.getClientIp(ctx.request)
  const usernameIPkey = getUsernameIPkey(request.body.email, ipAddr)

  const [resUsernameAndIP, resSlowByIP] = await Promise.all([
    limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey),
    limiterSlowBruteByIP.get(ipAddr)
  ])

  let retrySecs = 0

  // Check if IP or Username + IP is already blocked
  if (resSlowByIP !== null && resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay) {
    retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1
  } else if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP) {
    retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1
  }

  if (retrySecs > 0) {
    return throwError(429, 'Too many requests')
  }

  const result = await state.dbPool('bm_web_users')
    .select('player_id', 'password', 'updated')
    .where('email', request.body.email)
    .first()
  let successful = false

  if (result) {
    const match = await verify(result.password, request.body.password)

    if (match) successful = true
  }

  if (!successful) {
    try {
      // Always rate limit by username to prevent using rate limit detection to check if an account exists or not
      await Promise.all([limiterSlowBruteByIP.consume(ipAddr), limiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey)])
    } catch (e) {
      if (e instanceof Error) throw e

      return throwError(429, 'Too many requests')
    }

    return throwError(400, 'Incorrect login details')
  }

  ctx.session = create(result.player_id, result.updated, 'password')
  await ctx.session.manuallyCommit()

  response.body = null

  if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
    // Reset on successful authorisation
    await limiterConsecutiveFailsByUsernameAndIP.delete(usernameIPkey)
  }
}

async function handlePinLogin (ctx, { limiterSlowBruteByIP, limiterConsecutiveFailsByUsernameAndIP }) {
  const { response, throw: throwError, request, state } = ctx

  if (!/^[a-z0-9_]{2,16}$/i.test(request.body.name)) return throwError(400, 'Invalid name')

  if (typeof request.body.pin !== 'string') return throwError(400, 'Invalid pin type')
  if (!isLength(request.body.pin, { min: 6, max: 6 })) return throwError(400, 'Invalid pin, must be 6 characters')

  const server = state.serversPool.get(request.body.serverId)

  if (!server) return throwError(400, 'Server does not exist')

  const ipAddr = requestIp.getClientIp(ctx.request)
  const usernameIPkey = getUsernameIPkey(request.body.name, ipAddr)

  const [resUsernameAndIP, resSlowByIP] = await Promise.all([
    limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey),
    limiterSlowBruteByIP.get(ipAddr)
  ])

  let retrySecs = 0

  // Check if IP or Username + IP is already blocked
  if (resSlowByIP !== null && resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay) {
    retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1
  } else if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP) {
    retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1
  }

  if (retrySecs > 0) {
    return throwError(429, 'Too many requests')
  }

  const { playerPins, players } = server.config.tables
  const results = await server.pool(players + ' AS p')
    .select('pins.id AS id', 'p.id AS playerId', 'pins.pin AS pin')
    .rightJoin(playerPins + ' AS pins', 'pins.player_id', 'p.id')
    .where('p.name', request.body.name)
    .andWhere('pins.expires', '>', server.pool.raw('UNIX_TIMESTAMP()'))
  let matchedPin = null

  if (results) {
    for (const result of results) {
      const match = await verify(result.pin, request.body.pin)

      if (match) {
        matchedPin = result
        break
      }
    }
  }

  if (!matchedPin) {
    try {
      // Always rate limit by username to prevent using rate limit detection to check if an account exists or not
      await Promise.all([limiterSlowBruteByIP.consume(ipAddr), limiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey)])
    } catch (e) {
      if (e instanceof Error) throw e

      return throwError(429, 'Too many requests')
    }

    return throwError(400, 'Incorrect login details')
  }

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
