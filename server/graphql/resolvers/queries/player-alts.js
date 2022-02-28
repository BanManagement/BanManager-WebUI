const { unparse } = require('uuid-parse')
const { uniqBy } = require('lodash')
const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')

module.exports = async function playerAlts (obj, { player: id }, { state }, info) {
  const fields = parseResolveInfo(info)
  const player = await state.loaders.player.load({ id, fields: ['ip'] })

  if (!player) return []

  const results = await Promise.all(Array.from(state.serversPool.values()).map(async (server) => {
    if (!state.acl.hasServerPermission(server.id, 'player.alts', 'view')) return []

    const query = getSql(info.schema, server, fields, 'players')
      .where('ip', player.ip)
      .whereNot('id', player.id)

    return query.exec()
  }))

  return uniqBy(results.reduce((prev, cur) => prev.concat(cur)).map((player) => {
    player.id = unparse(player.id)

    return player
  }), 'id')
}
