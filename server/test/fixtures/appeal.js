const { date, lorem } = require('faker')

module.exports = function (punishmentId, type, server, actor, assignee) {
  const created = Math.round((new Date(date.past()).getTime() / 1000))

  return {
    server_id: server.id,
    punishment_id: punishmentId,
    punishment_type: type,
    actor_id: actor.id ? actor.id : actor,
    assignee_id: assignee ? assignee.id : undefined,
    reason: lorem.sentence(),
    created,
    updated: created,
    state_id: 1
  }
}
