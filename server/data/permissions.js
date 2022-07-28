const { unparse } = require('uuid-parse')
const { get } = require('lodash')
const memoize = require('memoizee')

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

async function loadPlayerResourceValues (dbPool, resourceName, serverId, playerIds) {
  const playerResourceValue = {}

  const roleResults = await dbPool('bm_web_role_resources AS rr')
    .select('rr.value AS value', 'bm_web_player_roles.player_id AS player_id')
    .innerJoin('bm_web_resources AS r', 'rr.resource_id', 'r.resource_id')
    .leftJoin('bm_web_player_roles', 'bm_web_player_roles.role_id', 'rr.role_id')
    .where('r.name', resourceName)
    .whereIn('bm_web_player_roles.player_id', playerIds)
  const serverRoleResults = await dbPool('bm_web_role_resources AS rr')
    .select('rr.value AS value', 'bm_web_player_server_roles.player_id AS player_id')
    .innerJoin('bm_web_resources AS r', 'rr.resource_id', 'r.resource_id')
    .leftJoin('bm_web_player_server_roles', 'bm_web_player_server_roles.role_id', 'rr.role_id')
    .where('r.name', resourceName)
    .where('bm_web_player_server_roles.server_id', serverId)
    .whereIn('bm_web_player_server_roles.player_id', playerIds)

  const mergePermissions = (row) => {
    const playerId = unparse(row.player_id)

    if (!playerResourceValue[playerId]) {
      playerResourceValue[playerId] = row.value
    } else {
      // Merge resource values, granting as many permissions as possible from duplicates
      const x = playerResourceValue[playerId]
      const y = row.value

      playerResourceValue[playerId] = x | y
    }
  }

  roleResults.forEach(mergePermissions)
  serverRoleResults.forEach(mergePermissions)

  return playerResourceValue
}

function getPermissionValue (permissionValues, resource, permission) {
  let value = get(permissionValues, [resource, permission], 0)

  if (permission === '*') { // Support wildcards @TODO Test
    value = Number.MAX_SAFE_INTEGER
  }

  return value
}

function hasPermission (permissionValues, resourceValue, resource, permission) {
  const value = getPermissionValue(permissionValues, resource, permission)

  return !!(resourceValue & value)
}

module.exports = { getPermissionValue, hasPermission, loadPermissionValues, loadRoleResourceValues, loadPlayerResourceValues }
