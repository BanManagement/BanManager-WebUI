const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')

module.exports = async function playerInfo (obj, { player: id }, { state }, info) {
  const fields = parseResolveInfo(info)
  const results = await Promise.all(Array.from(state.serversPool.values()).map(async (server) => {
    // @TODO PERMS CHEcK
    const query = getSql(info.schema, server, fields, 'players')
      .where('id', id)
    const result = await query.exec()

    if (result && result.length) {
      if (fields.fieldsByTypeName.Player.server) {
        result[0].server = server.config
      }

      return result[0]
    }
  }))

  return results
}
