const { date, lorem } = require('faker')

module.exports = function (punishment, type, server, actor, assignee, stateId = 1) {
  const created = Math.round((new Date(date.past()).getTime() / 1000))

  return {
    server_id: server.id,
    punishment_id: punishment.id,
    punishment_type: type,
    punishment_created: punishment.created,
    punishment_expires: punishment.expires,
    punishment_reason: punishment.reason,
    punishment_actor_id: punishment.actor_id,
    actor_id: actor.id ? actor.id : actor,
    assignee_id: assignee ? assignee.id : undefined,
    reason: lorem.sentence(),
    created,
    updated: created,
    state_id: stateId
  }
}
