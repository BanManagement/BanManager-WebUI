const { parse } = require('uuid-parse')

const verifyTables = async (serverConn, tables) => {
  const missing = []

  for (const [key, value] of Object.entries(tables)) {
    if (!(await serverConn.schema.hasTable(value))) {
      missing.push({ key, table: value })
    }
  }

  return { ok: missing.length === 0, missing }
}

const verifyConsolePlayer = async (serverConn, playersTable, consoleUuid) => {
  if (!consoleUuid) {
    return { ok: false, reason: 'missing-uuid' }
  }

  let parsedId

  if (Buffer.isBuffer(consoleUuid)) {
    parsedId = consoleUuid
  } else if (typeof consoleUuid === 'string' && /[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i.test(consoleUuid)) {
    parsedId = parse(consoleUuid, Buffer.alloc(16))
  } else {
    return { ok: false, reason: 'invalid-uuid' }
  }

  const player = await serverConn(playersTable).select('name').where('id', parsedId).first()

  if (!player) {
    return { ok: false, reason: 'not-found' }
  }

  return { ok: true, player, id: parsedId }
}

module.exports = {
  verifyTables,
  verifyConsolePlayer
}
