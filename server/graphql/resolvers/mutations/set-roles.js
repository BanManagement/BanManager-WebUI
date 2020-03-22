const { parse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')
const udify = require('../../../data/udify')

module.exports = async function setRoles (obj, { player, input: { roles, serverRoles } }, { log, state }) {
  const roleIds = roles
    .map(role => role.id)
    .concat(serverRoles.map(serverRole => serverRole.role.id))
  const dataRoles = await state.loaders.role.ids.loadMany(roleIds)

  if (dataRoles.filter(Boolean).length !== roleIds.length) {
    throw new ExposedError('Invalid role provided')
  }

  serverRoles.forEach(role => {
    if (!state.serversPool.get(role.server.id)) throw new ExposedError(`Server ${role.server.id} does not exist`)
  })

  // @TODO Should we validate players exist?
  const playerId = parse(player, Buffer.alloc(16))

  const globalRoles = roles.map(role => ({ role_id: role.id, player_id: playerId }))
  const serverDataRoles = serverRoles.map(({ role, server }) => ({ role_id: role.id, server_id: server.id, player_id: playerId }))

  const conn = await state.dbPool.getConnection()
  let success = false

  try {
    await conn.beginTransaction()

    // @TODO Optimise by only deleting/inserting changes
    await udify.delete(conn, 'bm_web_player_roles', { player_id: playerId })
    await udify.delete(conn, 'bm_web_player_server_roles', { player_id: playerId })
    await udify.insert(conn, 'bm_web_player_roles', globalRoles)
    await udify.insert(conn, 'bm_web_player_server_roles', serverDataRoles)

    await conn.commit()
    success = true
  } catch (e) {
    log.error(e)

    if (!conn.connection._fatalError) {
      await conn.rollback()
    }
  } finally {
    conn.release()
  }

  if (!success) throw new Error('An error occurred')

  return { id: player }
}
