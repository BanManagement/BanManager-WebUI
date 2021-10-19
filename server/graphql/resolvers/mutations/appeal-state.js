const appeal = require('../queries/appeal')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function appealState (obj, { state: stateId, id }, { state }, info) {
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

  await state.dbPool('bm_web_appeals').update({ updated: state.dbPool.raw('UNIX_TIMESTAMP()'), state_id: stateId }).where({ id })

  return appeal(obj, { id }, { state }, info)
}
