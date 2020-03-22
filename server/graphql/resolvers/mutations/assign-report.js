const { parse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')
const udify = require('../../../data/udify')

module.exports = async function assignReport (obj, { serverId, player, report: id }, { state }) {
  const server = state.serversPool.get(serverId)

  if (!server) throw new ExposedError(`Server ${serverId} does not exist`)

  const table = server.config.tables.playerReports
  const report = await state.loaders.report.serverDataId.load({ server: serverId, id })

  if (!report) throw new ExposedError(`Report ${id} does not exist`)

  const hasPermission = state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.any') ||
      (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.own') && state.acl.owns(report.actor.id)) ||
      (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.assigned') && state.acl.owns(report.assignee.id)) ||
      (state.acl.hasServerPermission(serverId, 'player.reports', 'update.assign.reported') && state.acl.owns(report.player.id))

  if (!hasPermission) throw new ExposedError('You do not have permission to perform this action, please contact your server administrator')

  const playerData = await state.loaders.player.ids.load(player)

  if (!playerData) throw new ExposedError(`Player ${player} does not exist`)

  await udify.update(server, table,
    { updated: 'UNIX_TIMESTAMP()', state_id: 2, assignee_id: parse(player, Buffer.alloc(16)) }, { id })

  report.assignee = playerData

  return report
}
