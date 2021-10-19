// const { parseResolveInfo } = require('graphql-parse-resolve-info')
const ExposedError = require('../../../data/exposed-error')
const playerBan = require('../queries/player-ban')
const playerKick = require('../queries/player-kick')
const playerMute = require('../queries/player-mute')
const playerWarning = require('../queries/player-warning')

module.exports = {
  PlayerPunishment: {
    __resolveType: (obj) => {
      return obj.__typename || obj.punishment_type
    }
  },
  PlayerAppeal: {
    punishment: {
      async resolve (obj, args, { state }, info) {
        let data

        switch (obj.punishment_type) {
          case 'PlayerBan':
            data = await playerBan(obj, { id: obj.punishment_id, serverId: obj.server_id }, { state }, info)

            break
          case 'PlayerKick':
            data = await playerKick(obj, { id: obj.punishment_id, serverId: obj.server_id }, { state }, info)

            break
          case 'PlayerMute':
            data = await playerMute(obj, { id: obj.punishment_id, serverId: obj.server_id }, { state }, info)

            break
          case 'PlayerWarning':
            data = await playerWarning(obj, { id: obj.punishment_id, serverId: obj.server_id }, { state }, info)

            break
          default:
            throw new ExposedError(`Invalid ${obj.punishment_type} as punishment type`)
        }

        data.__typename = obj.punishment_type

        return data
      }
    }
  }
}
