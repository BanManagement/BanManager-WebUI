const ExposedError = require('../../../data/exposed-error')
const { subscribeAppeal, unsubscribeAppeal, getAppealSubscription } = require('../../../data/notification/appeal')

module.exports = async function appealSubscriptionState (obj, { id, subscriptionState }, { session, state }, info) {
  const data = await state.dbPool('bm_web_appeals')
    .where({ id })
    .first()

  if (!data) throw new ExposedError(`Appeal ${id} does not exist`)

  const canView = state.acl.hasServerPermission(data.server_id, 'player.appeals', 'view.any') ||
    (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'view.own') && state.acl.owns(data.actor_id)) ||
    (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'view.assigned') && state.acl.owns(data.assignee_id))

  if (!canView) throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')

  if (subscriptionState === 'SUBSCRIBED') {
    await subscribeAppeal(state.dbPool, id, session.playerId)
  } else {
    await unsubscribeAppeal(state.dbPool, id, session.playerId)
  }

  return getAppealSubscription(state.dbPool, id, session.playerId)
}
