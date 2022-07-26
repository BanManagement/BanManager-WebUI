const { date, lorem } = require('faker')

module.exports = function (reportId, actor) {
  const created = Math.round((new Date(date.past()).getTime() / 1000))

  return {
    report_id: reportId,
    actor_id: actor.id ? actor.id : actor,
    comment: lorem.sentence(),
    created,
    updated: created
  }
}
