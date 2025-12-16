const { date, lorem } = require('faker')

module.exports = function (appealId, actor) {
  const created = Math.round((new Date(date.past()).getTime() / 1000))

  return {
    appeal_id: appealId,
    actor_id: actor.id ? actor.id : actor,
    content: lorem.sentence(),
    created,
    updated: created
  }
}
