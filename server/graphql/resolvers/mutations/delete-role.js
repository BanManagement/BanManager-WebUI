const role = require('../queries/role')
const ExposedError = require('../../../data/exposed-error')

module.exports = async function deleteRole (obj, { id }, { state }, info) {
  if (id < 4) throw new ExposedError('You may not delete default roles')

  const data = await role(obj, { id }, { state }, info)

  if (!data) throw new ExposedError(`Role ${id} does not exist`)

  await state.dbPool('bm_web_roles').where('role_id', id).del()

  return data
}
