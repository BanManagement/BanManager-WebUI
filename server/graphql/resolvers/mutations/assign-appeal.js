const { unparse } = require('uuid-parse')
const appeal = require('../queries/appeal')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function assignAppeal (obj, { player, id }, { state }, info) {
  const data = await state.dbPool('bm_web_appeals')
    .where({ id })
    .first()

  if (!data) throw new ExposedError(`Appeal ${id} does not exist`)

  const hasPermission = state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.assign.any') ||
      (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.assign.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.assign.assigned') && state.acl.owns(data.assignee_id))

  if (!hasPermission) throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')

  const server = state.serversPool.get(data.server_id)

  if (!server) throw new ExposedError(`Server ${data.server_id} does not exist`)

  const playerData = await server.pool(server.config.tables.players)
    .select('id')
    .where('id', player)
    .first()

  if (!playerData) throw new ExposedError(`Player ${unparse(player)} does not exist`)

  await state.dbPool('bm_web_appeals')
    .update({
      updated: state.dbPool.raw('UNIX_TIMESTAMP()'),
      state_id: 2,
      assignee_id: player
    })
    .where({ id })

  return appeal(obj, { id }, { state }, info)
}
