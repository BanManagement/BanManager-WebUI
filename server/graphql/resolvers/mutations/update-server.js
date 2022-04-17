const { createConnection } = require('mysql2/promise')
const { pick } = require('lodash')
const { encrypt } = require('../../../data/crypto')
const ExposedError = require('../../../data/exposed-error')
const { tables } = require('../../../data/tables')

module.exports = async function updateServer (obj, { id, input }, { state }) {
  if (!state.serversPool.has(id)) throw new ExposedError('Server not found')

  const serverExists = await state.dbPool('bm_web_servers')
    .select('id')
    .where('name', input.name)
    .first()

  if (serverExists && serverExists.id !== id) {
    throw new ExposedError('A server with this name already exists')
  }

  // @TODO Check if connection details changed to avoid needing password to change server name
  let conn

  try {
    conn = await createConnection(pick(input, ['host', 'port', 'database', 'user', 'password']))
  } catch (e) {
    throw new ExposedError(e.message)
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
    throw new ExposedError(`Tables do not exist in the database: ${tablesMissing.join(', ')}`)
  }

  const [[exists]] = await conn.query(
    'SELECT id FROM ?? WHERE id = ?'
    , [input.tables.players, input.console])

  await conn.end()

  if (!exists) {
    throw new ExposedError(`Console UUID not found in ${input.tables.players} table`)
  }

  if (input.password) {
    input.password = await encrypt(process.env.ENCRYPTION_KEY, input.password)
  } else {
    input.password = ''
  }

  // Clean up
  input.tables = JSON.stringify(input.tables)

  await state.dbPool('bm_web_servers').update(input).where({ id })

  return { id }
}
