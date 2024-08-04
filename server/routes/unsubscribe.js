module.exports = async function ({ request: { body }, throw: throwError, response, session, state }) {
  if (!session || !session.playerId) return throwError(400, 'You are not logged in')

  if (!body || !body.endpoint || !body.keys || !body.keys.auth || !body.keys.p256dh) {
    return throwError(400, 'Invalid request')
  }

  if (typeof body.endpoint !== 'string') return throwError(400, 'Invalid endpoint type')
  if (typeof body.keys.auth !== 'string') return throwError(400, 'Invalid auth type')
  if (typeof body.keys.p256dh !== 'string') return throwError(400, 'Invalid p256dh type')

  const [existingSubscription] = await state.dbPool('bm_web_notification_subscriptions')
    .select('id')
    .where('player_id', session.playerId)
    .where('endpoint', body.endpoint)

  if (existingSubscription) {
    await state.dbPool('bm_web_notification_subscriptions')
      .delete()
      .where('player_id', session.playerId)
      .where('endpoint', body.endpoint)
  }

  response.body = null
}
