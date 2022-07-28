const { unparse } = require('uuid-parse')
const { getNotificationState, generateNotificationId } = require('./')
const { hasPermission, loadPermissionValues, loadPlayerResourceValues } = require('../permissions')

const subscribeReport = async (dbPool, reportId, serverId, playerId) => {
  const subscription = await getReportSubscription(dbPool, reportId, serverId, playerId)

  if (subscription && subscription.state === 'SUBSCRIPTION') return subscription

  if (!subscription) {
    await dbPool('bm_web_report_watchers').insert({
      report_id: reportId,
      server_id: serverId,
      player_id: playerId,
      is_watching: 1,
      created: dbPool.raw('UNIX_TIMESTAMP()'),
      updated: dbPool.raw('UNIX_TIMESTAMP()')
    })
  } else {
    await dbPool('bm_web_report_watchers').update({
      is_watching: 1,
      updated: dbPool.raw('UNIX_TIMESTAMP()')
    }).where({
      report_id: reportId,
      server_id: serverId,
      player_id: playerId
    })
  }

  return await getReportSubscription(dbPool, reportId, serverId, playerId)
}

const unsubscribeReport = async (dbPool, reportId, serverId, playerId) => {
  const subscription = await getReportSubscription(dbPool, reportId, serverId, playerId)

  if (subscription && subscription.state === 'IGNORED') return subscription

  if (!subscription) {
    await dbPool('bm_web_report_watchers').insert({
      report_id: reportId,
      server_id: serverId,
      player_id: playerId,
      is_watching: 0,
      created: dbPool.raw('UNIX_TIMESTAMP()'),
      updated: dbPool.raw('UNIX_TIMESTAMP()')
    })
  } else {
    await dbPool('bm_web_report_watchers').update({
      is_watching: 0,
      updated: dbPool.raw('UNIX_TIMESTAMP()')
    }).where({
      report_id: reportId,
      server_id: serverId,
      player_id: playerId
    })
  }

  return await getReportSubscription(dbPool, reportId, serverId, playerId)
}

const getReportWatchers = async (dbPool, reportId, serverId) => {
  const data = await dbPool('bm_web_report_watchers')
    .select('player_id')
    .where({
      report_id: reportId,
      server_id: serverId,
      is_watching: 1
    })

  // eslint-disable-next-line camelcase
  return data.map(({ player_id }) => player_id)
}

const getReportSubscription = async (dbPool, reportId, serverId, playerId) => {
  const data = await dbPool('bm_web_report_watchers')
    .where({
      report_id: reportId,
      server_id: serverId,
      player_id: playerId
    })
    .first()

  if (data) {
    data.state = data.is_watching === 1 ? 'SUBSCRIBED' : 'IGNORED'
  }

  return data
}

const notifyReport = async (dbPool, type, reportId, server, commentId, actorId) => {
  const [data] = await server.pool(server.config.tables.playerReports)
    .select('actor_id', 'player_id', 'assignee_id')
    .where({ id: reportId })
  const permissionValues = await loadPermissionValues(dbPool)

  let players = await getReportWatchers(dbPool, reportId, server.config.id)

  if (actorId) {
    players = players.filter(id => !id.equals(actorId))
  }

  if (!players.length) return

  const playerPermissions = await loadPlayerResourceValues(dbPool, 'player.reports', server.config.id, players)

  // Notify only those who can view the report
  players = players.filter(player => {
    const playerId = unparse(player)
    const resourceValue = playerPermissions[playerId]

    if (!resourceValue) return false

    const canView = hasPermission(permissionValues, resourceValue, 'player.reports', 'view.any') ||
      (hasPermission(permissionValues, resourceValue, 'player.reports', 'view.own') && player.equals(data.actor_id)) ||
      (hasPermission(permissionValues, resourceValue, 'player.reports', 'view.assigned') && player.equals(data.assignee_id)) ||
      (hasPermission(permissionValues, resourceValue, 'player.reports', 'view.reported') && player.equals(data.player_id))

    return canView
  })

  return dbPool.transaction(async trx => {
    const notification = {
      type,
      report_id: reportId,
      server_id: server.config.id,
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
  getReportWatchers,
  getReportSubscription,
  notifyReport,
  subscribeReport,
  unsubscribeReport
}
