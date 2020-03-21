const ExposedError = require('../../../data/exposed-error')

module.exports = async function deleteServer (obj, { id }, { state }) {
  if (!state.serversPool.has(id)) throw new ExposedError('Server does not exist')

  await state.dbPool.execute('DELETE FROM bm_web_servers WHERE id = ?', [id])

  state.serversPool.get(id).pool.end().catch((error) => logger.error(error, 'servers-pool'))
  state.serversPool.delete(id)

  return id
}
