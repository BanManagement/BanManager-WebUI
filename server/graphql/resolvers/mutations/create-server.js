const { parse } = require('uuid-parse')
const { pick } = require('lodash')
const { encrypt } = require('../../../data/crypto')
const { generateServerId } = require('../../../data/generator')
const { createConnection } = require('mysql2/promise')
const { tables } = require('../../../data/tables')
const udify = require('../../../data/udify')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function createServer (obj, { input }, { state }) {
  const id = await generateServerId()
  const conn = await createConnection(pick(input, ['host', 'port', 'database', 'user', 'password']))

  const tablesMissing = []
  const tableNames = Object.keys(tables)

  for (const table of tableNames) {
    const [[{ exists }]] = await conn.execute(
      'SELECT COUNT(*) AS `exists` FROM information_schema.tables WHERE table_schema = ? AND table_name = ?'
      , [input.database, input.tables[table]])

    if (!exists) tablesMissing.push(table)
  }

  if (tablesMissing.length) {
    conn.end()
    throw new ExposedError(`Tables do not exist in the database: ${tablesMissing.join(', ')}`)
  }

  const [[exists]] = await conn.query(
    'SELECT id FROM ?? WHERE id = ?'
    , [input.tables.players, parse(input.console, Buffer.alloc(16))])

  conn.end()

  if (!exists) {
    throw new ExposedError(`Console UUID not found in ${input.tables.players} table`)
  }

  if (input.password) {
    input.password = await encrypt(process.env.ENCRYPTION_KEY, input.password)
  } else {
    input.password = ''
  }

  // Clean up
  input.console = parse(input.console, Buffer.alloc(16))
  input.tables = JSON.stringify(input.tables)

  await udify.insert(state.dbPool, 'bm_web_servers', { ...input, id })

  return { id }
}
