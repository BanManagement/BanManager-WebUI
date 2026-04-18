const { isValidHexKey } = require('./keys')
const { ADMIN_ROLE_ID } = require('./admin')

const SETUP_STATES = Object.freeze({
  NORMAL: 'normal',
  SETUP_NO_KEYS: 'setup_mode_no_keys',
  SETUP_NO_DB: 'setup_mode_no_db',
  SETUP_DB_UNREACHABLE: 'setup_mode_db_unreachable',
  SETUP_NO_ADMIN: 'setup_mode_no_admin'
})

const hasKeys = (env) =>
  isValidHexKey(env.ENCRYPTION_KEY) && isValidHexKey(env.SESSION_KEY)

const hasDbVars = (env) =>
  Boolean(env.DB_HOST && env.DB_NAME && env.DB_USER)

const isSetupComplete = async (dbPool) => {
  if (!dbPool) return false

  try {
    const usersTable = await dbPool.schema.hasTable('bm_web_users')
    const serversTable = await dbPool.schema.hasTable('bm_web_servers')
    const rolesTable = await dbPool.schema.hasTable('bm_web_player_roles')

    if (!usersTable || !serversTable || !rolesTable) return false

    const adminRow = await dbPool('bm_web_player_roles')
      .select('player_id')
      .where('role_id', ADMIN_ROLE_ID)
      .first()
    if (!adminRow) return false

    const serverRow = await dbPool('bm_web_servers').select('id').first()
    if (!serverRow) return false

    return true
  } catch (_) {
    return false
  }
}

const getSetupState = async (env, dbPool) => {
  if (!hasKeys(env)) return SETUP_STATES.SETUP_NO_KEYS
  if (!hasDbVars(env)) return SETUP_STATES.SETUP_NO_DB

  if (!dbPool) return SETUP_STATES.SETUP_DB_UNREACHABLE

  try {
    await dbPool.raw('SELECT 1+1 AS result')
  } catch (_) {
    return SETUP_STATES.SETUP_DB_UNREACHABLE
  }

  const complete = await isSetupComplete(dbPool)
  if (!complete) return SETUP_STATES.SETUP_NO_ADMIN

  return SETUP_STATES.NORMAL
}

const isSetupModeState = (state) => state !== SETUP_STATES.NORMAL

module.exports = {
  SETUP_STATES,
  hasKeys,
  hasDbVars,
  isSetupComplete,
  getSetupState,
  isSetupModeState
}
