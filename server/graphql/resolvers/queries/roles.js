module.exports = async function roles (obj, { defaultOnly }, { state: { dbPool } }) {
  const query = dbPool('bm_web_roles')
    .select('role_id AS id', 'name')

  if (defaultOnly) query.where('role_id', '<', 4)

  const roles = await query

  return roles
}
