const { unparse } = require('uuid-parse')
const { getNotificationState, generateNotificationId, getNotificationType } = require('./')
const { hasPermission, loadPermissionValues, loadPlayerResourceValues } = require('../permissions')

const subscribeAppeal = async (dbPool, appealId, playerId) => {
  const subscription = await getAppealSubscription(dbPool, appealId, playerId)

  if (subscription && subscription.state === 'SUBSCRIPTION') return subscription

  if (!subscription) {
    await dbPool('bm_web_appeal_watchers').insert({
      appeal_id: appealId,
      player_id: playerId,
      is_watching: 1,
      created: dbPool.raw('UNIX_TIMESTAMP()'),
      updated: dbPool.raw('UNIX_TIMESTAMP()')
    })
  } else {
    await dbPool('bm_web_appeal_watchers').update({
      is_watching: 1,
      updated: dbPool.raw('UNIX_TIMESTAMP()')
    }).where({
      appeal_id: appealId,
      player_id: playerId
    })
  }

  return await getAppealSubscription(dbPool, appealId, playerId)
}

const unsubscribeAppeal = async (dbPool, appealId, playerId) => {
  const subscription = await getAppealSubscription(dbPool, appealId, playerId)

  if (subscription && subscription.state === 'IGNORED') return subscription

  if (!subscription) {
    await dbPool('bm_web_appeal_watchers').insert({
      appeal_id: appealId,
      player_id: playerId,
      is_watching: 0,
      created: dbPool.raw('UNIX_TIMESTAMP()'),
      updated: dbPool.raw('UNIX_TIMESTAMP()')
    })
  } else {
    await dbPool('bm_web_appeal_watchers').update({
      is_watching: 0,
      updated: dbPool.raw('UNIX_TIMESTAMP()')
    }).where({
      appeal_id: appealId,
      player_id: playerId
    })
  }

  return await getAppealSubscription(dbPool, appealId, playerId)
}

const getAppealWatchers = async (dbPool, appealId) => {
  const data = await dbPool('bm_web_appeal_watchers')
    .select('player_id')
    .where({
      appeal_id: appealId,
      is_watching: 1
    })

  // eslint-disable-next-line camelcase
  return data.map(({ player_id }) => player_id)
}

const getAppealSubscription = async (dbPool, appealId, playerId) => {
  const data = await dbPool('bm_web_appeal_watchers')
    .where({
      appeal_id: appealId,
      player_id: playerId
    })
    .first()

  if (data) {
    data.state = data.is_watching === 1 ? 'SUBSCRIBED' : 'IGNORED'
  }

  return data
}

const notifyRuleGroups = async (dbPool, type, id, serverId, commentId, actorId) => {
  const roles = await dbPool('bm_web_notification_rules')
    .select('role_id')
    .leftJoin('bm_web_notification_rule_roles AS r', 'bm_web_notification_rules.id', 'r.notification_rule_id')
    .where('type', type)
    .andWhere(builder => {
      builder
        .where('server_id', '=', serverId)
        .orWhereNull('server_id')
    })

  if (!roles.length) return

  const roleIds = roles.map(role => role.role_id)
  const players = await dbPool.select('player_id')
    .from(function () {
      this.unionAll([
        dbPool
          .select('player_id')
          .from('bm_web_player_roles')
          .whereIn('role_id', roleIds),
        dbPool
          .select('player_id')
          .from('bm_web_player_server_roles')
          .whereIn('role_id', roleIds)
          .andWhere('server_id', serverId)
      ], true)
        .as('subquery')
    })
    .groupBy('player_id')

  if (!players.length) return

  const playerIds = players.map(player => player.player_id)

  switch (type) {
    case 'APPEAL_CREATED':
      return notifyAppealPlayers(dbPool, getNotificationType('appealCreated'), id, serverId, commentId, actorId, playerIds)

    default:
      throw Error(`Unknown notification rule type ${type}`)
  }
}

const notifyAppeal = async (dbPool, type, appealId, serverId, commentId, actorId) => {
  const players = await getAppealWatchers(dbPool, appealId)

  return notifyAppealPlayers(dbPool, type, appealId, serverId, commentId, actorId, players)
}

const notifyAppealPlayers = async (dbPool, type, appealId, serverId, commentId, actorId, players) => {
  const [data] = await dbPool('bm_web_appeals')
    .select('actor_id', 'assignee_id')
    .where({ id: appealId })
  const permissionValues = await loadPermissionValues(dbPool)

  if (actorId) {
    players = players.filter(id => !id.equals(actorId))
  }

  if (!players.length) return

  const playerPermissions = await loadPlayerResourceValues(dbPool, 'player.appeals', serverId, players)

  // Notify only those who can view the appeal
  players = players.filter(player => {
    const playerId = unparse(player)
    const resourceValue = playerPermissions[playerId]

    if (!resourceValue) return false

    const canView = hasPermission(permissionValues, resourceValue, 'player.appeals', 'view.any') ||
      (hasPermission(permissionValues, resourceValue, 'player.appeals', 'view.own') && player.equals(data.actor_id)) ||
      (hasPermission(permissionValues, resourceValue, 'player.appeals', 'view.assigned') && data.assignee_id && player.equals(data.assignee_id))

    return canView
  })

  return dbPool.transaction(async trx => {
    const notification = {
      type,
      appeal_id: appealId,
      server_id: serverId,
      state_id: getNotificationState('unread'),
      actor_id: actorId,
      comment_id: commentId,
      created: trx.raw('UNIX_TIMESTAMP()'),
      updated: trx.raw('UNIX_TIMESTAMP()')
    }

    for (const playerId of players) {
      await trx('bm_web_notifications').insert({ ...notification, id: await generateNotificationId(), player_id: playerId })
    }
  })
}

module.exports = {
  getAppealWatchers,
  getAppealSubscription,
  notifyAppeal,
  notifyRuleGroups,
  subscribeAppeal,
  unsubscribeAppeal
}
