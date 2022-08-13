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

    return server
  }))
}
