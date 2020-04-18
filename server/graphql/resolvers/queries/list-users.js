const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')

function handleFilters (query, { email, roles, serverRoles, dbPool }) {
  const unions = []

  if (email) {
    unions.push(dbPool.select('player_id').from('bm_web_users').where('email', 'like', `${email}%`))
  }

  if (roles && roles.length) {
    unions.push(dbPool.select('player_id').from('bm_web_player_roles').whereIn('role_id', roles.map(row => row.role_id)))
  }

  if (serverRoles && serverRoles.length) {
    unions.push(dbPool.select('player_id').from('bm_web_player_server_roles').whereIn('role_id', serverRoles.map(row => row.role_id)))
  }

  query.union(unions)
}

module.exports = async function listUsers (obj, { player, email, role, serverRole, limit, offset }, { state: { dbPool } }, info) {
  if (limit > 50) throw new ExposedError('Limit too large')

  const filtered = !player && (!!email || !!role || !!serverRole)

  const totalQuery = dbPool.select(dbPool.raw('COUNT(*) AS total'))
  const query = dbPool.select('x.player_id')

  if (filtered) {
    let roles
    let serverRoles

    if (role) {
      roles = await dbPool('bm_web_roles').select('role_id').where('name', 'like', `${role}%`)

      if (!roles.length) return { total: 0, records: [] }
    }
    if (serverRole) {
      serverRoles = await dbPool('bm_web_roles').select('role_id').where('name', 'like', `${serverRole}%`)

      if (!serverRoles.length) return { total: 0, records: [] }
    }

    const filters = { email, roles, serverRoles, dbPool }

    totalQuery.from({
      x: function () {
        handleFilters(this, filters)
      }
    })

    query.from({
      x: function () {
        handleFilters(this, filters)
      }
    })
  } else {
    totalQuery.from({
      x: function () {
        this.select('player_id')
          .from('bm_web_player_roles')
          .union([
            dbPool.select('player_id').from('bm_web_player_server_roles'),
            dbPool.select('player_id').from('bm_web_users')
          ])
      }
    })
    query.from({
      x: function () {
        this.select('player_id')
          .from('bm_web_player_roles')
          .union([
            dbPool.select('player_id').from('bm_web_player_server_roles'),
            dbPool.select('player_id').from('bm_web_users')
          ])
      }
    })
  }

  query.groupBy('player_id').limit(limit).offset(offset)

  const [{ total }] = await totalQuery

  if (total === 0) return { total, records: [] }

  if (offset > total) throw new ExposedError('Offset greater than total')

  const results = await query
  const userIds = results.map(row => row.player_id)

  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)

  const users = getSql(info.schema, {
    pool: dbPool,
    config: {
      tables: {
        users: 'bm_web_users',
        roles: 'bm_web_roles',
        playerRoles: 'bm_web_player_roles',
        playerServerRoles: 'bm_web_player_server_roles',
        servers: 'bm_web_servers'
      }
    }
  }, fields.records, 'users').whereIn('player_id', userIds)

  const records = await users.exec()

  return { total, records }
}
