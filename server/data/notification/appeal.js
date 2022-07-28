const { unparse } = require('uuid-parse')
const { getNotificationState, generateNotificationId } = require('./')
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

const notifyAppeal = async (dbPool, type, appealId, serverId, commentId, actorId) => {
  const [data] = await dbPool('bm_web_appeals')
    .select('actor_id', 'assignee_id')
    .where({ id: appealId })
  const permissionValues = await loadPermissionValues(dbPool)

  let players = await getAppealWatchers(dbPool, appealId)

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
      (hasPermission(permissionValues, resourceValue, 'player.appeals', 'view.assigned') && player.equals(data.assignee_id))

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
  subscribeAppeal,
  unsubscribeAppeal
}
