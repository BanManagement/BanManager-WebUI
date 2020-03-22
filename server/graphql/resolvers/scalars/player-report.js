const { parse, unparse } = require('uuid-parse')
const { find } = require('lodash')

module.exports =
{
  PlayerReport:
  {
    comments:
    {
      async resolve ({ id, server: { id: serverId } }, args, { state }) {
        const server = state.serversPool.get(serverId)
        const tables = server.config.tables
        const commentsQuery = `
          SELECT
            c.id, c.comment, c.actor_id, a.name, created, updated
          FROM
            ${tables.playerReportComments} c
              LEFT JOIN
            ${tables.players} a ON c.actor_id = a.id
          WHERE report_id = ?
          ORDER BY created DESC`
        const [commentResults] = await server.execute(commentsQuery, [id])
        const comments = commentResults.map(comment => {
          return {
            id: comment.id,
            created: comment.created,
            updated: comment.updated,
            actor: {
              id: unparse(comment.actor_id),
              name: comment.name
            },
            message: comment.comment,
            acl: {
              delete: state.acl.hasServerPermission(serverId, 'player.reports', 'delete.any') ||
                (state.acl.hasServerPermission(serverId, 'player.reports', 'delete.own') && state.acl.owns(comment.actor_id)) ||
                (state.acl.hasServerPermission(serverId, 'player.reports', 'delete.any')) ||
                (state.acl.hasServerPermission(serverId, 'player.reports', 'delete.own') && state.acl.owns(comment.actor_id))
            }
          }
        })

        return comments
      }
    },
    locations:
    {
      async resolve (report, args, { state }) {
        const server = state.serversPool.get(report.server.id)
        const tables = server.config.tables
        const locationsQuery = `
          SELECT
            player_id, p.name, world, x, y, z, pitch, yaw
          FROM ${tables.playerReportLocations}
            LEFT JOIN
              ${tables.players} p ON player_id = p.id
          WHERE report_id = ?
        `
        const [locationResults] = await server.execute(locationsQuery, [report.id])
        const playerLocation = find(locationResults, { player_id: parse(report.player.id, Buffer.alloc(16)) })
        const actorLocation = find(locationResults, { player_id: parse(report.actor.id, Buffer.alloc(16)) })
        const locations = {}

        if (playerLocation) {
          locations.player = {
            x: playerLocation.x,
            y: playerLocation.y,
            z: playerLocation.z,
            yaw: playerLocation.yaw,
            pitch: playerLocation.pitch,
            world: playerLocation.world,
            player: {
              id: unparse(playerLocation.player_id),
              name: playerLocation.name
            }
          }
        }

        if (actorLocation) {
          locations.actor = {
            x: actorLocation.x,
            y: actorLocation.y,
            z: actorLocation.z,
            yaw: actorLocation.yaw,
            pitch: actorLocation.pitch,
            world: actorLocation.world,
            player: {
              id: unparse(actorLocation.player_id),
              name: actorLocation.name
            }
          }
        }

        return locations
      }
    },
    serverLogs:
    {
      async resolve (report, args, { state }) {
        const server = state.serversPool.get(report.server.id)
        const tables = server.config.tables
        const serverLogsQuery = `
          SELECT
            sl.id, sl.message, sl.created
          FROM
            ${tables.playerReportLogs} rl
              LEFT JOIN
            ${tables.serverLogs} sl ON rl.log_id = sl.id
          WHERE
            rl.report_id = ?`
        const [serverLogs] = await server.execute(serverLogsQuery, [report.id])

        return serverLogs
      }
    },
    commands:
    {
      async resolve (report, args, { state }) {
        const server = state.serversPool.get(report.server.id)
        const tables = server.config.tables
        const commandsQuery = `
          SELECT
            rc.id,
            rc.actor_id,
            p.name,
            rc.command,
            rc.args,
            rc.created,
            rc.updated
          FROM
            ${tables.playerReportCommands} rc
              LEFT JOIN
            ${tables.players} p ON rc.actor_id = p.id
          WHERE
            rc.report_id = ?
        `
        const [commandResults] = await server.execute(commandsQuery, [report.id])
        const commands = commandResults.map(command => {
          return {
            id: command.id,
            command: command.command,
            args: command.args,
            created: command.created,
            updated: command.updated,
            actor: {
              id: unparse(command.actor_id),
              name: command.name
            }
          }
        })

        return commands
      }
    }
  }
}
