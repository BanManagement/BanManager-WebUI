const ExposedError = require('../../../data/exposed-error')
const { getAppealCommentType } = require('../../utils')
const { getNotificationType } = require('../../../data/notification')
const { subscribeAppeal, notifyAppeal } = require('../../../data/notification/appeal')

module.exports = async function appealState (obj, { state: stateId, id }, { session, state }, info) {
  const [data] = await state.dbPool('bm_web_appeals').where({ id })

  if (!data) throw new ExposedError(`Appeal ${id} does not exist`)

  const canUpdate = state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.state.any') ||
    (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.state.own') && state.acl.owns(data.actor_id)) ||
    (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.state.assigned') && state.acl.owns(data.assignee_id))

  if (!canUpdate) {
    throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')
  }

  const row = await state.dbPool('bm_web_appeal_states').where('id', stateId).first()

  if (!row) throw new ExposedError(`Appeal State ${stateId} does not exist`)

  let commentId

  await state.dbPool.transaction(async trx => {
    await trx('bm_web_appeals')
      .update({
        updated: trx.raw('UNIX_TIMESTAMP()'),
        state_id: stateId
      })
      .where({ id })

    const [insertId] = await trx('bm_web_appeal_comments').insert({
      appeal_id: id,
      actor_id: session.playerId,
      state_id: stateId,
      type: getAppealCommentType('state'),
      created: trx.raw('UNIX_TIMESTAMP()'),
      updated: trx.raw('UNIX_TIMESTAMP()')
    }, ['id'])

    commentId = insertId

    await subscribeAppeal(trx, id, session.playerId)
    await notifyAppeal(trx, getNotificationType('appealState'), id, data.server_id, commentId, session.playerId)
  })

  return { appealId: id, commentId }
}
