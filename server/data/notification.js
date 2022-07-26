const { unparse } = require('uuid-parse')
const { nanoid } = require('nanoid/async')
const { hasPermission, loadPermissionValues, loadPlayerResourceValues } = require('../data/permissions')

const types = ['reportComment', 'reportAssigned', 'reportState']
const states = ['unread', 'read']

const subscribeReport = async (dbPool, reportId, serverId, playerId) => {
  const hasSubscribed = await dbPool('bm_web_report_watchers')
    .select('id')
    .where({
      report_id: reportId,
      server_id: serverId,
      player_id: playerId
    })
    .first()

  if (hasSubscribed?.id) return

  return dbPool('bm_web_report_watchers').insert({
    report_id: reportId,
    server_id: serverId,
    player_id: playerId,
    is_watching: 1,
    created: dbPool.raw('UNIX_TIMESTAMP()'),
    updated: dbPool.raw('UNIX_TIMESTAMP()')
  })
}

const getReportWatchers = async (dbPool, reportId, serverId) => {
  const data = await dbPool('bm_web_report_watchers')
    .select('player_id')
    .where({
      report_id: reportId,
      server_id: serverId
    })

  // eslint-disable-next-line camelcase
  return data.map(({ player_id }) => player_id)
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

    const canView = (hasPermission(permissionValues, resourceValue, 'player.reports', 'view.own') && player.equals(data.actor_id)) ||
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

const getUnreadNotificationsCount = async (dbPool, playerId) => {
  const data = await dbPool('bm_web_notifications')
    .count({ count: '*' })
    .where({
      player_id: playerId,
      state_id: getNotificationState('unread')
    })
    .first()

  return data?.count || 0
}

const getNotificationType = (type) => {
  if (typeof type === 'string') return types.findIndex(t => t === type)

  return types[type]
}

const getNotificationState = (type) => {
  if (typeof type === 'string') return states.findIndex(t => t === type)

  return states[type]
}

const generateNotificationId = async () => nanoid()

module.exports = {
  subscribeReport, getReportWatchers, notifyReport, getNotificationType, getNotificationState, getUnreadNotificationsCount
}
