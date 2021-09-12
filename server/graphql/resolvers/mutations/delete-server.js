const ExposedError = require('../../../data/exposed-error')

module.exports = async function deleteServer (obj, { id }, { state }) {
  if (!state.serversPool.has(id)) throw new ExposedError('Server does not exist')
  if (state.serversPool.size === 1) throw new ExposedError('Cannot delete only server, please add a new server and then delete the old one')

  await state.dbPool('bm_web_servers').where('id', id).del()

  state.serversPool.get(id).pool.destroy()
  state.serversPool.delete(id)

  return id
}
