const appeal = require('../queries/appeal')
const report = require('../queries/report')

module.exports = {
  Notification: {
    appeal: {
      async resolve (obj, args, context, info) {
        try {
          if (obj.appeal_id) return await appeal(obj, { id: obj.appeal_id }, context, info)
        } catch (e) {
          console.log(e)
        }
      }
    },
    report: {
      async resolve (obj, args, context, info) {
        try {
          if (obj.report_id) return await report(obj, { id: obj.report_id, serverId: obj.server_id }, context, info)
        } catch (e) {
        }
      }
    }
  }
}
