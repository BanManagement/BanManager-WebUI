const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')

module.exports = function servers (obj, args, { state, log }, info) {
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)

  return Promise.all(Array.from(state.serversPool.values()).map(async ({ config, pool }) => {
    const server = Object.assign({ console: { id: config.console } }, config)

    server.console = { id: server.console }

    if (fields.timeOffset) {
      try {
        const now = Math.floor(Date.now() / 1000)
        const [data] = await pool.raw(`SELECT (${now} - UNIX_TIMESTAMP()) AS mysqlTime`)
        const mysqlTime = data[0].mysqlTime
        const offset = mysqlTime > 0 ? Math.floor(mysqlTime) : Math.ceil(mysqlTime)

        server.timeOffset = offset * 1000
      } catch (e) {
        log.error(e, `failed to retrieve time offset for server ${config.name}`)

        server.timeOffset = 0
      }
    }

    if (fields.stats) {
      server.stats = {}
    }

    if (fields.stats.fieldsByTypeName.ServerStatistics.totalActiveBans) {
      try {
        const { totalActiveBans } = await pool(config.tables.playerBans)
          .select(pool.raw('COUNT(*) AS `totalActiveBans`'))
          .first()

        server.stats.totalActiveBans = totalActiveBans
      } catch (e) {
        log.error(e, `failed to retrieve total active bans for server ${config.name}`)

        server.stats.totalActiveBans = 0
      }
    }

    if (fields.stats.fieldsByTypeName.ServerStatistics.totalActiveMutes) {
      try {
        const { totalActiveMutes } = await pool(config.tables.playerMutes)
          .select(pool.raw('COUNT(*) AS `totalActiveMutes`'))
          .first()

        server.stats.totalActiveMutes = totalActiveMutes
      } catch (e) {
        log.error(e, `failed to retrieve total active mutes for server ${config.name}`)

        server.stats.totalActiveMutes = 0
      }
    }

    if (fields.stats.fieldsByTypeName.ServerStatistics.totalReports) {
      try {
        const { totalReports } = await pool(config.tables.playerReports)
          .select(pool.raw('COUNT(*) AS `totalReports`'))
          .first()

        server.stats.totalReports = totalReports
      } catch (e) {
        log.error(e, `failed to retrieve total reports for server ${config.name}`)

        server.stats.totalReports = 0
      }
    }

    if (fields.stats.fieldsByTypeName.ServerStatistics.totalWarnings) {
      try {
        const { totalWarnings } = await pool(config.tables.playerWarnings)
          .select(pool.raw('COUNT(*) AS `totalWarnings`'))
          .first()

        server.stats.totalWarnings = totalWarnings
      } catch (e) {
        log.error(e, `failed to retrieve total warnings for server ${config.name}`)

        server.stats.totalWarnings = 0
      }
    }

    return server
  }))
}
