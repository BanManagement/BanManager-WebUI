const ExposedError = require('../../../data/exposed-error')

module.exports = async function deleteRole (obj, { id }, { state }) {
  if (id < 4) throw new ExposedError('You may not delete default roles')

  const role = await state.loaders.role.ids.load(id)

  if (!role) throw new ExposedError(`Role ${id} does not exist`)

  await state.dbPool.execute('DELETE FROM bm_web_roles WHERE role_id = ?', [id])

  return role
}
