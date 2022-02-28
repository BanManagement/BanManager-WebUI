const appeal = require('../queries/appeal')
const appealComment = require('../queries/appeal-comment')

module.exports = {
  PlayerAppealUpdated: {
    appeal: {
      async resolve (obj, args, context, info) {
        return appeal(obj, { id: obj.appealId }, context, info)
      }
    },
    comment: {
      async resolve (obj, args, context, info) {
        return appealComment(obj, { id: obj.commentId }, context, info)
      }
    }
  }
}
