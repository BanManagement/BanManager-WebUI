const { unparse } = require('uuid-parse')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function listPlayers (obj, { name, email, role, serverRole, limit, offset }, { state }) {
  // @TODO Caching
  if (limit > 50) throw new ExposedError('Limit too large')

  const filters = []
  const filtered = !!email || !!role || !!serverRole
  const args = []

  let totalQuery = 'SELECT COUNT(*) AS total FROM ('
  let query = 'SELECT x.player_id FROM ('

  if (filtered) {
    // @TODO Find a way to easily filter on names, right now we have to search every server players table :'(
    // if (name) {
    //   filters.push(`SELECT player_id FROM bm_web_users WHERE current_name LIKE ?`)
    //   args.push(name + '%')
    // }

    if (email) {
      filters.push('SELECT player_id FROM bm_web_users WHERE email LIKE ?')
      args.push(email + '%')
    }

    if (role) {
      const roleName = role + '%'
      const [results] = await state.dbPool.execute('SELECT role_id FROM bm_web_roles WHERE name LIKE ?', [roleName])
      const roleIds = results.map(row => row.role_id)

      if (roleIds.length) {
        filters.push('SELECT player_id FROM bm_web_player_roles WHERE role_id IN(?)')
        args.push(roleIds.join())
      }
    }

    if (serverRole) {
      const roleName = serverRole + '%'
      const [results] = await state.dbPool.execute('SELECT role_id FROM bm_web_roles WHERE name LIKE ?', [roleName])
      const roleIds = results.map(row => row.role_id)

      if (roleIds.length) {
        filters.push('SELECT player_id FROM bm_web_player_server_roles WHERE role_id IN(?)')
        args.push(roleIds.join())
      }
    }

    const queryFilter = filters.join(' UNION ALL ')

    totalQuery += queryFilter
    query += queryFilter
  } else {
    const noFilterQuery = `
      SELECT
        player_id
      FROM
        bm_web_player_roles pr
      UNION SELECT
        player_id
      FROM
        bm_web_player_server_roles sr
      UNION SELECT
        player_id
      FROM bm_web_users`

    totalQuery += noFilterQuery
    query += noFilterQuery
  }

  totalQuery += ') x'
  query += ') x GROUP BY x.player_id LIMIT ?, ?'

  if (totalQuery === 'SELECT COUNT(*) AS total FROM () x') return { total: 0, players: [] } // No results

  const [[{ total }]] = await state.dbPool.execute(totalQuery, args)

  if (offset > total) throw new ExposedError('Offset greater than total')

  args.push(offset, limit)

  const [results] = await state.dbPool.execute(query, args)

  const players = results.map(row => ({ id: unparse(row.player_id) }))

  return { total, players }
}
