const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')

module.exports = {
  User: {
    player: {
      async resolve (obj, args, { state }, info) {
        const parsedResolveInfoFragment = parseResolveInfo(info)
        const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)

        return state.loaders.player.load({ id: obj.id || obj.player.id, fields: Object.keys(fields) })
      }
    }
  }
}
