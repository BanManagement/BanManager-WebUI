const { unparse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')
const { getAppealCommentType } = require('../../utils')
const { getNotificationType } = require('../../../data/notification')
const { subscribeAppeal, notifyAppeal } = require('../../../data/notification/appeal')

module.exports = async function resolveAppealDeleteMute (obj, { id }, { session, state }, info) {
  const data = await state.dbPool('bm_web_appeals')
    .where({ id })
    .first()

  if (!data) throw new ExposedError(`Appeal ${id} does not exist`)

  const server = state.serversPool.get(data.server_id)

  if (!server) throw new ExposedError('Server does not exist')

  const punishment = await server.pool(server.config.tables.playerMutes)
    .where({ id: data.punishment_id })
    .first()

  if (!punishment) throw new ExposedError('Punishment associated with this appeal no longer exists')

  const canUpdate = state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.state.any') ||
    (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.state.own') && state.acl.owns(data.actor_id)) ||
    (state.acl.hasServerPermission(data.server_id, 'player.appeals', 'update.state.assigned') && state.acl.owns(data.assignee_id))
  const canDelete = state.acl.hasServerPermission(data.server_id, 'player.mutes', 'delete.any') ||
    (state.acl.hasServerPermission(data.server_id, 'player.mutes', 'delete.own') && state.acl.owns(punishment.actor_id))

  if (!canUpdate || !canDelete) {
    throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')
  }

  let commentId

  await server.pool.transaction(async trx => {
    const select = trx.select(
      'b.player_id',
      'b.reason',
      'b.expires',
      trx.raw('UNHEX(?)', unparse(session.playerId).replace(/-/g, '')),
      'b.actor_id',
      'b.created',
      trx.raw('UNIX_TIMESTAMP()'),
      trx.raw('?', 'WebUI'),
      'b.silent'
    )
      .from(`${server.config.tables.playerMutes} as b`)
      .where('b.id', data.punishment_id)

    await trx(
      trx.raw(
        '?? (??, ??, ??, ??, ??, ??, ??, ??, ??)', [
          server.config.tables.playerMuteRecords,
          'player_id',
          'reason',
          'expired',
          'actor_id',
          'pastActor_id',
          'pastCreated',
          'created',
          'createdReason',
          'silent'
        ]
      )
    ).insert(select)

    await trx(server.config.tables.playerMutes).where({ id: data.punishment_id }).del()

    return await state.dbPool.transaction(async trx => {
      const [insertId] = await trx('bm_web_appeal_comments').insert({
        appeal_id: id,
        actor_id: session.playerId,
        state_id: 3,
        type: getAppealCommentType('deletepunishment'),
        created: trx.raw('UNIX_TIMESTAMP()'),
        updated: trx.raw('UNIX_TIMESTAMP()')
      }, ['id'])

      commentId = insertId

      await subscribeAppeal(trx, id, session.playerId)
      await notifyAppeal(trx, getNotificationType('appealDeletePunishment'), id, data.server_id, commentId, session.playerId)

      return trx('bm_web_appeals').update({ updated: trx.raw('UNIX_TIMESTAMP()'), state_id: 3 }).where({ id })
    })
  })

  return { appealId: id, commentId }
}
