const { createConnection } = require('mysql2/promise')
const { pick } = require('lodash')
const { encrypt } = require('../../../data/crypto')
const { setupPool } = require('../../../connections')
const ExposedError = require('../../../data/exposed-error')
const { tables } = require('../../../data/tables')

module.exports = async function updateServer (obj, { id, input }, { log, state }) {
  if (!state.serversPool.has(id)) throw new ExposedError('Server not found', 'SERVER_NOT_FOUND')

  const serverExists = await state.dbPool('bm_web_servers')
    .select('id')
    .where('name', input.name)
    .first()

  if (serverExists && serverExists.id !== id) {
    throw new ExposedError('A server with this name already exists', 'ALREADY_EXISTS')
  }

  // @TODO Check if connection details changed to avoid needing password to change server name
  let conn

  try {
    conn = await createConnection(pick(input, ['host', 'port', 'database', 'user', 'password']))
  } catch (e) {
    throw new ExposedError(e.message, 'DB_CONNECTION_ERROR')
  }

  const tableNames = Object.keys(tables)
  const tablesMissing = []

  for (const table of tableNames) {
    const [[{ exists }]] = await conn.execute(
      'SELECT COUNT(*) AS `exists` FROM information_schema.tables WHERE table_schema = ? AND table_name = ?'
      , [input.database, input.tables[table]])

    if (!exists) tablesMissing.push(table)
  }

  if (tablesMissing.length) {
    await conn.end()
    throw new ExposedError(`Tables do not exist in the database: ${tablesMissing.join(', ')}`, 'MISSING_DATABASE_TABLES')
  }

  const [[exists]] = await conn.query(
    'SELECT id FROM ?? WHERE id = ?'
    , [input.tables.players, input.console])

  await conn.end()

  if (!exists) {
    throw new ExposedError(`Console UUID not found in ${input.tables.players} table`, 'CONSOLE_UUID_NOT_FOUND')
  }

  const rawPassword = input.password
  const parsedTables = input.tables

  if (rawPassword) {
    input.password = await encrypt(process.env.ENCRYPTION_KEY, rawPassword)
  } else {
    input.password = ''
  }

  input.tables = JSON.stringify(parsedTables)

  await state.dbPool('bm_web_servers').update(input).where({ id })

  // Mirror createServer/deleteServer and refresh the in-memory pool here so
  // subsequent reads see the new config immediately, rather than waiting for
  // the 3-second background sync in connections/servers-pool.js to catch up.
  const existingEntry = state.serversPool.get(id)
  const oldConfig = existingEntry.config
  const connectionChanged =
    oldConfig.host !== input.host ||
    oldConfig.port !== input.port ||
    oldConfig.user !== input.user ||
    oldConfig.database !== input.database ||
    Boolean(rawPassword)

  let pool = existingEntry.pool

  if (connectionChanged) {
    existingEntry.pool.destroy().catch((error) => log?.error?.(error, 'updateServer'))
    pool = setupPool({
      host: input.host,
      port: input.port,
      user: input.user,
      password: rawPassword,
      database: input.database
    }, log)
  }

  state.serversPool.set(id, {
    config: {
      id,
      name: input.name,
      host: input.host,
      port: input.port,
      user: input.user,
      database: input.database,
      tables: parsedTables,
      console: input.console
    },
    pool
  })

  return { id }
}
