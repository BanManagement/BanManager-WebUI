const ExposedError = require('../../../data/exposed-error')

module.exports = async function server (obj, { id }, { state: { serversPool } }) {
  if (!serversPool.has(id)) throw new ExposedError('Server not found')

  const server = Object.assign({}, serversPool.get(id).config)

  server.console = { id: server.console }

  const now = Math.floor(Date.now() / 1000)
  const [data] = await serversPool.get(id).pool.raw(`SELECT (${now} - UNIX_TIMESTAMP()) AS mysqlTime`)
  const mysqlTime = data[0].mysqlTime
  const offset = mysqlTime > 0 ? Math.floor(mysqlTime) : Math.ceil(mysqlTime)

  server.timeOffset = offset * 1000

  return server
}
