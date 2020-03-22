module.exports = async function roles (obj, { defaultOnly }, { state: { dbPool } }) {
  let query = 'SELECT role_id AS id, name FROM bm_web_roles'

  if (defaultOnly) query += ' WHERE role_id < 4'

  const [roles] = await dbPool.execute(query)

  return roles
}
