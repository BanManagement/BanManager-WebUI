const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { uniq } = require('lodash')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function setRoles (obj, { player, input: { roles, serverRoles } }, { log, state }, info) {
  const roleIds = uniq(roles
    .map(role => role.id)
    .concat(serverRoles.map(serverRole => serverRole.role.id)))
  const dataRoles = await state.dbPool('bm_web_roles').whereIn('role_id', roleIds)

  if (dataRoles.filter(Boolean).length !== roleIds.length) {
    throw new ExposedError('Invalid role provided')
  }

  serverRoles.forEach(role => {
    if (!state.serversPool.get(role.server.id)) throw new ExposedError(`Server ${role.server.id} does not exist`)
  })

  const globalRoles = roles.map(role => ({ role_id: role.id, player_id: player }))
  const serverDataRoles = serverRoles.map(({ role, server }) => ({ role_id: role.id, server_id: server.id, player_id: player }))

  await state.dbPool.transaction(async trx => {
    // @TODO Optimise by only deleting/inserting changes
    await trx('bm_web_users').insert({ player_id: player }).onDuplicateUpdate('player_id')
    await trx('bm_web_player_roles').where({ player_id: player }).del()
    await trx('bm_web_player_server_roles').where({ player_id: player }).del()

    if (globalRoles.length) {
      await trx('bm_web_player_roles').insert(globalRoles)
    }

    if (serverDataRoles.length) {
      await trx('bm_web_player_server_roles').insert(serverDataRoles)
    }

    await trx.commit()
  })

  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, {
    pool: state.dbPool,
    config: {
      tables: {
        users: 'bm_web_users',
        roles: 'bm_web_roles',
        playerRoles: 'bm_web_player_roles',
        playerServerRoles: 'bm_web_player_server_roles',
        servers: 'bm_web_servers'
      }
    }
  }, fields, 'users').where('player_id', player)
  const [user] = await query.exec()

  return user
}
