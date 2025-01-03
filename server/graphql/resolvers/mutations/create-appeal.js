const ExposedError = require('../../../data/exposed-error')
const appealResolver = require('../queries/appeal')
const { notifyRuleGroups, subscribeAppeal } = require('../../../data/notification/appeal')
const { triggerWebhook } = require('../../../data/webhook')
const { unparse } = require('uuid-parse')

module.exports = async function createAppeal (obj, { input: { serverId, punishmentId, type, reason } }, { log, state, session }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')

  const exists = await state.dbPool('bm_web_appeals')
    .where({ server_id: serverId, punishment_id: punishmentId, punishment_type: type })
    .andWhere('state_id', '<=', 2)
    .first()

  if (exists) {
    throw new ExposedError('An appeal already exists for this punishment')
  }

  const server = state.serversPool.get(serverId)
  const canAny = state.acl.hasServerPermission(serverId, 'player.appeals', 'create.any')

  let data

  switch (type) {
    case 'PlayerBan':
      if (!canAny && !state.acl.hasServerPermission(serverId, 'player.appeals', 'create.ban')) {
        throw new ExposedError(
          'You do not have permission to perform this action, please contact your server administrator')
      }

      data = await server.pool(server.config.tables.playerBans).where({ id: punishmentId }).first()

      break
    case 'PlayerKick':
      if (!canAny && !state.acl.hasServerPermission(serverId, 'player.appeals', 'create.kick')) {
        throw new ExposedError(
          'You do not have permission to perform this action, please contact your server administrator')
      }

      data = await server.pool(server.config.tables.playerKicks).where({ id: punishmentId }).first()

      break
    case 'PlayerMute':
      if (!canAny && !state.acl.hasServerPermission(serverId, 'player.appeals', 'create.mute')) {
        throw new ExposedError(
          'You do not have permission to perform this action, please contact your server administrator')
      }

      data = await server.pool(server.config.tables.playerMutes).where({ id: punishmentId }).first()

      break
    case 'PlayerWarning':
      if (!canAny && !state.acl.hasServerPermission(serverId, 'player.appeals', 'create.warning')) {
        throw new ExposedError(
          'You do not have permission to perform this action, please contact your server administrator')
      }

      data = await server.pool(server.config.tables.playerWarnings).where({ id: punishmentId }).first()

      break
    default:
      throw new ExposedError(`Invalid ${type} as punishment type`)
  }

  if (!data) throw new ExposedError(`Could not find ${type} of id ${punishmentId}`)

  if (!state.acl.owns(data.player_id)) throw new ExposedError('You cannot appeal a punishment you do not own')

  const appeal = {
    server_id: serverId,
    punishment_id: punishmentId,
    punishment_type: type,
    punishment_reason: data.reason,
    punishment_created: data.created,
    punishment_expires: data.expires || 0,
    punishment_actor_id: data.actor_id,
    actor_id: session.playerId,
    assignee_id: null,
    reason,
    created: state.dbPool.raw('UNIX_TIMESTAMP()'),
    updated: state.dbPool.raw('UNIX_TIMESTAMP()'),
    state_id: 1
  }

  if (type === 'PlayerMute') {
    appeal.punishment_soft = data.soft
  }

  if (type === 'PlayerWarning') {
    appeal.punishment_points = data.points
  }

  const [id] = await state.dbPool('bm_web_appeals').insert(appeal, ['id'])

  await subscribeAppeal(state.dbPool, id, session.playerId)
  await notifyRuleGroups(state.dbPool, 'APPEAL_CREATED', id, server.config.id, null, session.playerId, state)

  try {
    await triggerWebhook(log, state, 'APPEAL_CREATED', {
      appealId: id,
      actorId: unparse(session.playerId),
      actorName: (await state.loaders.player.load({ id: session.playerId, fields: ['name'] })).name,
      serverId
    })
  } catch (error) {
    log.error(error)
  }

  return appealResolver(obj, { id }, { session, state }, info)
}
