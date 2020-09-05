const memoize = require('memoizee')
const { get } = require('lodash')
const { parse } = require('uuid-parse')
const { valid } = require('../data/session')

module.exports = async (ctx, next) => {
  const { state } = ctx
  const { dbPool } = state
  let resourceValues = {}
  const serverResourceValues = {}
  let hasServerPermission = (serverId, resource, permission) => {
    return state.acl.hasPermission(resource, permission)
  }

  state.permissionValues = await loadPermissionValues(dbPool)

  if (valid(ctx.session)) {
    // Check if session requires invalidating due to password change
    const checkResult = await dbPool('bm_web_users')
      .select('updated')
      .where('player_id', ctx.session.playerId)
      .andWhere('updated', '<', ctx.session.updated)
      .first()

    if (checkResult) {
      // Password has changed recently, invalidate ctx.session
      ctx.session = null
    }
  }

  if (!valid(ctx.session)) { // Validate twice in case previous check invalidates
    // They're a guest, load Guest role permissions
    resourceValues = await loadRoleResourceValues(dbPool, 1)
  } else {
    const playerRoleResults = await dbPool('bm_web_role_resources AS rr')
      .select('r.name AS name', 'rr.value AS value')
      .innerJoin('bm_web_resources AS r', 'rr.resource_id', 'r.resource_id')
      .leftJoin('bm_web_player_roles', 'bm_web_player_roles.role_id', 'rr.role_id')
      .where('bm_web_player_roles.player_id', ctx.session.playerId)

    if (!playerRoleResults.length) {
      // They're a guest, load Guest role permissions
      resourceValues = await loadRoleResourceValues(dbPool, 1)
    } else {
      playerRoleResults.forEach((row) => {
        if (!resourceValues[row.name]) {
          resourceValues[row.name] = row.value
        } else {
          // Merge resource values, granting as many permissions as possible from duplicates
          const x = resourceValues[row.name]
          const y = row.value

          if (!(x & y)) resourceValues[row.name] = x + y
        }
      })
    }

    // Check server specific roles
    const serverRoleResults = await dbPool('bm_web_role_resources AS rr')
      .select('r.name AS name', 'rr.value AS value')
      .innerJoin('bm_web_resources AS r', 'rr.resource_id', 'r.resource_id')
      .leftJoin('bm_web_player_server_roles', 'bm_web_player_server_roles.role_id', 'rr.role_id')
      .where('bm_web_player_server_roles.player_id', ctx.session.playerId)

    if (serverRoleResults.length) {
      serverRoleResults.forEach((row) => {
        if (!serverResourceValues[row.server_id]) {
          serverResourceValues[row.server_id] = {}
          serverResourceValues[row.server_id][row.name] = row.value
        } else {
          // Merge resource values, granting as many permissions as possible from duplicates
          // @TODO Test this
          const server = serverResourceValues[row.server_id]
          const x = server[row.name]
          const y = row.value

          if (!(x & y)) server[row.name] = x + y
        }
      })

      hasServerPermission = (serverId, resource, permission) => {
        // Check if they have global permission
        if (state.acl.hasPermission(resource, permission)) return true

        let value = get(state.permissionValues, [resource, permission], 0)

        if (permission === '*') { // Support wildcards @TODO Test
          value = Number.MAX_SAFE_INTEGER
        }

        return !!(get(serverResourceValues, [serverId, resource], null) & value)
      }
    }
  }

  state.acl =
    {
      hasServerPermission,
      hasPermission (resource, permission) {
        let value = get(state.permissionValues, [resource, permission], 0)

        if (permission === '*') { // Support wildcards @TODO Test
          value = Number.MAX_SAFE_INTEGER
        }

        return !!(resourceValues[resource] & value)
      },
      owns (actorId) {
        if (!actorId) return false

        const playerId = get(ctx.session, 'playerId', null)

        if (!playerId) return false

        if (!Buffer.isBuffer(actorId)) actorId = parse(actorId, Buffer.alloc(16))

        return actorId.equals(playerId)
      }
    }

  return next()
}

async function loadRoleResourceValues (dbPool, roleId) {
  const results = await dbPool('bm_web_role_resources AS rr')
    .select('r.name AS name', 'rr.value AS value')
    .innerJoin('bm_web_resources AS r', 'rr.resource_id', 'r.resource_id')
    .leftJoin('bm_web_player_server_roles', 'bm_web_player_server_roles.role_id', 'rr.role_id')
    .where('rr.role_id', roleId)
  const resourceValues = {}

  results.forEach((row) => {
    resourceValues[row.name] = row.value
  })

  return resourceValues
}

async function loadPermissionValues (dbPool) {
  const load = async () => {
    const results = await dbPool('bm_web_resource_permissions AS rp')
      .column({ resource_id: 'rp.resource_id', resource_name: 'r.name', name: 'rp.name', value: 'rp.value' })
      .select()
      .innerJoin('bm_web_resources AS r', 'r.resource_id', 'rp.resource_id')
    const permissionValues = {}

    results.forEach((row) => {
      if (!permissionValues[row.resource_name]) permissionValues[row.resource_name] = {}

      permissionValues[row.resource_name][row.name] = row.value
    })

    return permissionValues
  }

  // Cache for 5 minutes
  return memoize(load, { async: true, prefetch: true, maxAge: 300 * 1000 })()
}
