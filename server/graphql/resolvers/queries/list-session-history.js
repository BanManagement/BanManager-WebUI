const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')
const ExposedError = require('../../../data/exposed-error')

// eslint-disable-next-line complexity
module.exports = async function listPlayerSessionHistory (obj, { serverId, player, limit, offset, order = 'leave_DESC' }, { state }, info) {
  if (!state.serversPool.has(serverId)) throw new ExposedError('Server does not exist')
  if (limit > 50) throw new ExposedError('Limit too large')

  const server = state.serversPool.get(serverId)
  const totalQuery = server.pool(server.config.tables.playerHistory)
    .select(server.pool.raw('COUNT(*) AS total'))

  if (player) {
    totalQuery.where('player_id', player)
  }

  const [{ total }] = await totalQuery

  if (offset > total) throw new ExposedError('Offset greater than total')
  if (total === 0) return { total, records: [] }

  const [col, type] = order.split('_')
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)
  const query = getSql(info.schema, server, fields.records, 'playerHistory').limit(limit).offset(offset).orderBy(col, type)

  if (player) {
    query.where('player_id', player)
  }

  const data = await query.exec()

  return { total, records: data }
}
