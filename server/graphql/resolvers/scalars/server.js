const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')

module.exports = {
  Server: {
    stats: {
      async resolve (obj, args, { state: { serversPool }, log }, info) {
        const parsedResolveInfoFragment = parseResolveInfo(info)
        const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)

        const id = obj.id || args.id
        const server = serversPool.get(id)
        const stats = {
          totalActiveBans: 0,
          totalActiveMutes: 0,
          totalReports: 0,
          totalWarnings: 0
        }

        if (fields?.totalActiveBans) {
          try {
            const { totalActiveBans } = await server.pool(server.config.tables.playerBans)
              .select(server.pool.raw('COUNT(*) AS `totalActiveBans`'))
              .first()

            stats.totalActiveBans = totalActiveBans
          } catch (e) {
            log.error(e, `failed to retrieve total active bans for server ${server.config.name}`)
          }
        }

        if (fields?.totalActiveMutes) {
          try {
            const { totalActiveMutes } = await server.pool(server.config.tables.playerMutes)
              .select(server.pool.raw('COUNT(*) AS `totalActiveMutes`'))
              .first()

            stats.totalActiveMutes = totalActiveMutes
          } catch (e) {
            log.error(e, `failed to retrieve total active mutes for server ${server.config.name}`)
          }
        }

        if (fields?.totalReports) {
          try {
            const { totalReports } = await server.pool(server.config.tables.playerReports)
              .select(server.pool.raw('COUNT(*) AS `totalReports`'))
              .first()

            stats.totalReports = totalReports
          } catch (e) {
            log.error(e, `failed to retrieve total reports for server ${server.config.name}`)
          }
        }

        if (fields?.totalWarnings) {
          try {
            const { totalWarnings } = await server.pool(server.config.tables.playerWarnings)
              .select(server.pool.raw('COUNT(*) AS `totalWarnings`'))
              .first()

            stats.totalWarnings = totalWarnings
          } catch (e) {
            log.error(e, `failed to retrieve total warnings for server ${server.config.name}`)
          }
        }

        return stats
      }
    }
  }
}
