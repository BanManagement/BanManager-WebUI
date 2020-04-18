const { differenceWith } = require('lodash')
const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function assignRole (obj, { players, role: id }, { state }, info) {
  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, {
    pool: state.dbPool,
    config: {
      tables: {
        roles: 'bm_web_roles'
      }
    }
  }, fields, 'roles').where('role_id', id)
  const [role] = await query.exec()

  if (!role) throw new ExposedError(`Role ${id} does not exist`)

  // Ensure they exist in bm_web_users
  await state.dbPool('bm_web_users')
    .insert(players.map(p => ({ player_id: p })))
    .onDuplicateUpdate('player_id')

  // Check if players are already in this role, and if so, ignore, making this mutation idempotent
  const results = await state.dbPool('bm_web_player_roles')
    .select('player_id')
    .where('role_id', id)
    .whereIn('player_id', players)

  if (results.length) {
    players = differenceWith(players, results.map(row => row.player_id), (a, b) => a.equals(b))
  }

  if (!players.length) return role

  const rows = players.map(player => ({ player_id: player, role_id: id }))

  await state.dbPool('bm_web_player_roles').insert(rows)

  return role
}
