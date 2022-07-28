const { unparse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')
const { getAppealCommentType } = require('../../utils')
const { getNotificationType } = require('../../../data/notification')
const { subscribeAppeal, notifyAppeal } = require('../../../data/notification/appeal')

module.exports = async function assignAppeal (obj, { player, id }, { session, state }, info) {
  const data = await state.dbPool('bm_web_appeals')
    .where({ id })
    .first()

  if (!data) throw new ExposedError(`Appeal ${id} does not exist`)

  const hasPermission = state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.assign.any') ||
      (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.assign.own') && state.acl.owns(data.actor_id)) ||
      (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.assign.assigned') && state.acl.owns(data.assignee_id))

  if (!hasPermission) throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')
  if (data.actor_id.equals(player)) throw new ExposedError('You cannot assign an appeal to the player which created it')

  const server = state.serversPool.get(data.server_id)

  if (!server) throw new ExposedError(`Server ${data.server_id} does not exist`)

  const playerData = await server.pool(server.config.tables.players)
    .select('id')
    .where('id', player)
    .first()

  if (!playerData) throw new ExposedError(`Player ${unparse(player)} does not exist`)

  let commentId

  await state.dbPool.transaction(async trx => {
    await trx('bm_web_appeals')
      .update({
        updated: trx.raw('UNIX_TIMESTAMP()'),
        state_id: 2,
        assignee_id: player
      })
      .where({ id })

    const [insertId] = await trx('bm_web_appeal_comments').insert({
      appeal_id: id,
      actor_id: session.playerId,
      assignee_id: player,
      state_id: 2,
      type: getAppealCommentType('assigned'),
      created: trx.raw('UNIX_TIMESTAMP()'),
      updated: trx.raw('UNIX_TIMESTAMP()')
    }, ['id'])

    commentId = insertId

    await subscribeAppeal(trx, id, session.playerId)
    await subscribeAppeal(trx, id, player)
    await notifyAppeal(trx, getNotificationType('appealAssigned'), id, server.config.id, commentId, session.playerId)
  })

  return { appealId: id, commentId }
}
