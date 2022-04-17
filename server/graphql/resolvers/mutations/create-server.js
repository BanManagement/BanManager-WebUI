const { pick } = require('lodash')
const { encrypt } = require('../../../data/crypto')
const { generateServerId } = require('../../../data/generator')
const { createConnection } = require('mysql2/promise')
const { tables } = require('../../../data/tables')
const { setupPool } = require('../../../connections')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function createServer (obj, { input }, { log, state }) {
  const serverExists = await state.dbPool('bm_web_servers')
    .select('id')
    .where('name', input.name)
    .first()

  if (serverExists) {
    throw new ExposedError('A server with this name already exists')
  }

  const id = await generateServerId()
  let conn

  try {
    conn = await createConnection(pick(input, ['host', 'port', 'database', 'user', 'password']))
  } catch (e) {
    e.exposed = true

    throw e
  }

  const tablesMissing = []
  const tableNames = Object.keys(tables)

  for (const table of tableNames) {
    const [[{ exists }]] = await conn.execute(
      'SELECT COUNT(*) AS `exists` FROM information_schema.tables WHERE table_schema = ? AND table_name = ?'
      , [input.database, input.tables[table]])

    if (!exists) tablesMissing.push(table)
  }

  if (tablesMissing.length) {
    await conn.end()
    throw new ExposedError(`Tables do not exist in the database: ${tablesMissing.join(', ')}`)
  }

  const [[exists]] = await conn.query(
    'SELECT id FROM ?? WHERE id = ?'
    , [input.tables.players, input.console])

  await conn.end()

  if (!exists) {
    throw new ExposedError(`Console UUID not found in ${input.tables.players} table`)
  }

  const password = input.password

  if (password) {
    input.password = await encrypt(process.env.ENCRYPTION_KEY, input.password)
  } else {
    input.password = ''
  }

  // Clean up
  const parsedTables = input.tables
  input.tables = JSON.stringify(input.tables)

  await state.dbPool('bm_web_servers').insert({ ...input, id })

  const poolConfig = {
    host: input.host,
    port: input.port,
    user: input.user,
    password: password,
    database: input.database
  }
  const pool = setupPool(poolConfig, log)
  const serverDetails = {
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
  }

  state.serversPool.set(id, serverDetails)

  return { id }
}
