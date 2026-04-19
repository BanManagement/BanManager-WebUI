module.exports = async function ({ request: { body }, throw: throwError, response, session, state }) {
  if (!session || !session.playerId) return throwError(400, 'You are not logged in', { code: 'NOT_LOGGED_IN' })

  if (!body || !body.endpoint || !body.keys || !body.keys.auth || !body.keys.p256dh) {
    return throwError(400, 'Invalid request', { code: 'INVALID_INPUT' })
  }

  if (typeof body.endpoint !== 'string') return throwError(400, 'Invalid endpoint type', { code: 'INVALID_INPUT' })
  if (typeof body.keys.auth !== 'string') return throwError(400, 'Invalid auth type', { code: 'INVALID_INPUT' })
  if (typeof body.keys.p256dh !== 'string') return throwError(400, 'Invalid p256dh type', { code: 'INVALID_INPUT' })

  const [existingSubscription] = await state.dbPool('bm_web_notification_subscriptions')
    .select('id')
    .where('player_id', session.playerId)
    .where('endpoint', body.endpoint)

  if (existingSubscription) return throwError(400, 'Subscription already exists', { code: 'SUBSCRIPTION_EXISTS' })

  await state.dbPool('bm_web_notification_subscriptions')
    .insert({
      player_id: session.playerId,
      endpoint: body.endpoint,
      auth: body.keys.auth,
      p256dh: body.keys.p256dh,
      expiration: body.expirationTime,
      created: state.dbPool.raw('UNIX_TIMESTAMP()')
    })

  response.body = null
}
