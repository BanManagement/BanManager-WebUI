const ExposedError = require('../../../data/exposed-error')

module.exports = async function server (obj, { id }, { state: { serversPool }, log }) {
  if (!serversPool.has(id)) throw new ExposedError('Server not found')

  const server = Object.assign({}, serversPool.get(id).config)

  server.console = { id: server.console }

  try {
    const now = Math.floor(Date.now() / 1000)
    const [data] = await serversPool.get(id).pool.raw(`SELECT (${now} - UNIX_TIMESTAMP()) AS mysqlTime`)
    const mysqlTime = data[0].mysqlTime
    const offset = mysqlTime > 0 ? Math.floor(mysqlTime) : Math.ceil(mysqlTime)

    server.timeOffset = offset * 1000
  } catch (e) {
    log.error(e, `failed to retrieve time offset for server ${server.name}`)

    server.timeOffset = 0
  }

  return server
}
